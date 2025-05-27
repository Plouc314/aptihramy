import json
import polars as pl
from typing import BinaryIO

import blitzbeaver as bb
from blitzbeaver.literals import ID, Element
from blitzbeaver import (
    TrackerDiagnostics,
    MaterializedTrackingChain,
    NormalizationConfig,
)
from models.database import Manifest, DatabaseStatus
from constants import COLUMN_RAW_TO_PRETTY


class Database:

    def __init__(
        self,
        record_schema: bb.RecordSchema,
        path_manifest: str,
        path_graph: str,
        path_dataframes: str,
        path_normalized_dataframes: str,
    ):
        self._record_schema = record_schema
        self._path_manifest = path_manifest
        self._path_graph = path_graph
        self._path_dataframes = path_dataframes
        self._path_normalized_dataframes = path_normalized_dataframes
        self._feature_indexes = self._get_feature_indexes()
        self._manifest: Manifest | None = None
        self._graph: bb.TrackingGraph | None = None
        self._dataframes: list[pl.DataFrame] | None = None
        self._normalized_dataframes: list[pl.DataFrame] | None = None
        self._feature_last_frame_value: dict[str, dict[ID, list[str]]] | None = None

    def initialize(self) -> None:
        self._manifest = self._load_manifest(self._path_manifest)

        if self._manifest.is_graph:
            self._graph = bb.read_beaver(self._path_graph)
            self._feature_last_frame_value = self._build_last_frame_values()

        if self._manifest.dataframes_years is not None:
            self._dataframes = self._load_dataframes(
                self._path_dataframes, self._manifest.dataframes_years
            )

        if self._manifest.normalized_dataframes_years is not None:
            self._normalized_dataframes = self._load_dataframes(
                self._path_normalized_dataframes,
                self._manifest.normalized_dataframes_years,
            )

    def _load_manifest(self, path_manifest: str) -> Manifest:
        with open(path_manifest, "r") as file:
            return Manifest(**json.load(file))

    def _load_dataframes(
        self,
        csv_path: str,
        years: list[str],
    ) -> list[pl.DataFrame]:
        """
        Reads CSV files for each year in the range and returns them as a list of Polars DataFrames.

        Returns:
            list[pl.DataFrame]: A list of DataFrames loaded from CSV files.
        """
        return [
            pl.read_csv(f"{csv_path}/{year}.csv", infer_schema_length=10000)
            for year in years
        ]

    def save_graph(self, graph: bb.TrackingGraph) -> None:
        bb.save_beaver(self._path_graph, graph)
        self._graph = graph
        self._feature_last_frame_value = self._build_last_frame_values()
        self._manifest.is_graph = True

    def save_dataframes(self, zip_file: BinaryIO, is_normalized: bool) -> None:
        pass

    def get_database_status(self) -> DatabaseStatus:
        if self._manifest.dataframes_years is None:
            return DatabaseStatus(error="Missing dataframes.")
        if self._manifest.normalized_dataframes_years is None:
            return DatabaseStatus(error="Missing normalized dataframes.")
        if (
            self._manifest.dataframes_years
            != self._manifest.normalized_dataframes_years
        ):
            return DatabaseStatus(
                error="Dataframes years does not match normalized dataframes years."
            )
        if not self._manifest.is_graph:
            return DatabaseStatus(error="Missing tracking graph.")
        return DatabaseStatus(ready=True)

    def _get_feature_indexes(self) -> dict[str, int]:
        """
        Constructs a dictionnary mapping a tracked feature to its index
        Returns:
            dict[str, int]: A dictionnary where:
                - Keys are tracked features (from schema)
                - Values are the index of the feature in the schema list
        """
        d = {}
        for i, field in enumerate(self._record_schema.fields):
            d[field.name] = i
        return d

    def _build_last_frame_values(self) -> dict[str, dict[ID, list[str]]]:
        """
        Constructs a nested dictionary containing the last recorded memory values for each feature
        from the latest diagnostic frame of each tracker.

        feature -> trackerId -> [feature values of the last frame for this tracker]

        Returns:
            dict[str, dict[ID, list[str]]]: A dictionary where:
                - Keys are feature names (from schema).
                - Values are dictionaries mapping tracker IDs to their last recorded memory values.
        """
        d = {}
        for schema in self._record_schema.fields:
            feature_index = self.get_feature_index(schema.name)
            if feature_index is None:
                continue

            tracker_feature_mem = {}
            for tracker_id in self._graph.trackers_ids:
                tracker_diagnostic = self._graph.diagnostics.get_tracker(tracker_id)
                if (
                    tracker_diagnostic is not None
                    and len(tracker_diagnostic.frames) > 0
                ):
                    last_diagnostic = tracker_diagnostic.frames[-1]
                    tracker_feature_mem[tracker_id] = last_diagnostic.memory[
                        feature_index
                    ]

            d[schema.name] = tracker_feature_mem
        return d

    def get_feature_index(self, raw_feature: str) -> int | None:
        return self._feature_indexes.get(raw_feature)

    def get_diagnostics(self, tracker_id: ID) -> TrackerDiagnostics | None:
        """
        Retrieves diagnostics for a specific tracker.

        Args:
            tracker_id (ID): The ID of the tracker.

        Returns:
            TrackerDiagnostics | None: The diagnostics for the tracker, or None if not found.
        """
        return self._graph.diagnostics.get_tracker(tracker_id)

    def get_all_memory_from_last_frame_for_trackers(
        self, tracker_ids: list[ID]
    ) -> dict[ID, list[list[str]]]:
        """
        Retrieve the memory content from the last frame of each specified tracker.

        Args:
            tracker_ids (list[ID]): List of tracker IDs to retrieve memory from.

        Returns:
            dict[ID, list[list[str]]]: A dictionary mapping each tracker ID to the memory
            content (as a 2D list of strings) of its last frame. If a tracker is not found,
            an empty list is returned for that ID.
        """

        ret = {}
        for tracker_id in tracker_ids:
            tracker = self._graph.diagnostics.get_tracker(tracker_id)
            ret[tracker_id] = tracker.frames[-1].memory if tracker else []
        return ret

    def get_filtred_trackers(
        self, raw_feature: str, search_values: list[str]
    ) -> set[ID]:
        """
        Finds all tracker IDs where the last recorded feature contains a specific value.

        Args:
            raw_feature (str): The raw feature to search within.
            search_value (list[str]): The values to search for.

        Returns:
            list[ID]: A list of tracker IDs matching the search criteria.
        """
        tracker_feature_mem = self._feature_last_frame_value.get(raw_feature)
        if not tracker_feature_mem:
            return set()

        matching_trackers: set[ID] = set()
        for tracker_id, mem_values in tracker_feature_mem.items():
            for value in mem_values:
                if any(search_value in value for search_value in search_values):
                    matching_trackers.add(tracker_id)
                    break

        return matching_trackers

    def get_filtred_trackers_multiple_features(
        self, feature_search_values: dict[str, list[str]]
    ) -> set[ID]:
        """
        Finds tracker IDs that match ALL given feature-value filters.

        Args:
            feature_search_values (dict[str, list[str]]):
                A dictionary where keys are feature names and values are lists of search terms.

        Returns:
            set[ID]: A set of tracker IDs that match all provided filters.
        """
        iterator = iter(feature_search_values.items())
        first_key, first_value = next(iterator)

        matching_trackers: set[ID] = self.get_filtred_trackers(first_key, first_value)

        for feature, search_values in iterator:
            matching_trackers = matching_trackers.intersection(
                self.get_filtred_trackers(feature, search_values)
            )

        return matching_trackers

    def get_tracked_features(self) -> tuple[list[str], list[str]]:
        """
        Retrieves the list of tracked features in both raw and pretty format.

        Returns:
            tuple[list[str], list[str]]:
                - A list of raw feature names (from the schema).
                - A list of human-readable feature names (mapped from COLUMN_RAW_TO_PRETTY).
        """
        raw = [feature.name for feature in self._record_schema.fields]
        pretty = [COLUMN_RAW_TO_PRETTY[col] for col in raw]
        return (raw, pretty)

    def _get_values_from_df(
        self, dfs: list[pl.DataFrame], frame_idx: int, record_idx: int
    ) -> list[Element]:
        """
        Retrieves the values for a specific record index in a frame index in the provided dataframes.

        Args:
            dfs (list[pl.Dataframe]): the dataframes from which the values are retrieved
            frame_idx (int): Index of the frame (e.g., year).
            record_idx (int): Index of the record within the frame.

        Returns:
            list[Element]: A list of raw values in the order defined by the feature config.

        Raises:
            IndexError: If the frame or record index is out of range.
        """
        if not (0 <= frame_idx < len(dfs)):
            raise IndexError(f"Frame index {frame_idx} is out of range.")

        frame = dfs[frame_idx]

        if not (0 <= record_idx < len(frame)):
            raise IndexError(
                f"Record index {record_idx} is out of range for frame {frame_idx}."
            )

        raw_tracked_features, _ = self.get_tracked_features()
        row = frame.select(raw_tracked_features).row(record_idx)

        return list(row)

    def get_raw_values_for_frame_idx_record_idx(
        self, frame_idx: int, record_idx: int
    ) -> list[Element]:
        """
        Retrieves the raw values for a specific record in a frame.

        Args:
            frame_idx (int): Index of the frame (e.g., year).
            record_idx (int): Index of the record within the frame.

        Returns:
            list[Element]: A list of raw values in the order defined by the feature config.

        Raises:
            IndexError: If the frame or record index is out of range.
        """
        return self._get_values_from_df(self._dataframes, frame_idx, record_idx)

    def get_normalized_values_for_frame_idx_record_idx(
        self, frame_idx: int, record_idx: int
    ) -> list[Element]:
        """
        Retrieves the normalized values for a specific record in a frame.

        Args:
            frame_idx (int): Index of the frame (e.g., year).
            record_idx (int): Index of the record within the frame.

        Returns:
            list[Element]: A list of raw values in the order defined by the feature config.

        Raises:
            IndexError: If the frame or record index is out of range.
        """
        return self._get_values_from_df(
            self._normalized_dataframes, frame_idx, record_idx
        )

    def get_frame_idx_record_idxs_from_materialized_chain(
        self, materialized_chain: MaterializedTrackingChain
    ) -> dict[int, list[int]]:
        d = {}
        for frame in materialized_chain.frames:
            if frame.frame_diagnostic is None:
                # Put the matching record index
                d[frame.frame_idx] = [frame.record_idx]
                continue
            d[frame.frame_idx] = [
                record.record_idx for record in frame.frame_diagnostic.records
            ]

        return d

    def get_tracked_years(self) -> list[int]:
        return self._manifest.dataframes_years

    def get_materialized_tracking_chain(
        self, tracker_id: ID
    ) -> MaterializedTrackingChain:
        """
        Retrieves the materialized tracking chain for a tracker.

        Args:
            tracker_id (ID): The ID of the tracker.

        Returns:
            MaterializedTrackingChain: The materialized tracking chain object.
        """
        return self._graph.materialize_tracking_chain(
            tracker_id, self._dataframes, self._record_schema
        )

    def get_tracking_chain(self, tracker_id: int) -> list[tuple[int, int]]:
        """
        Retrieves a list of (frame_idx, record_idx) tuples for a tracker.

        Args:
            tracker_id (int): The ID of the tracker.

        Returns:
            list[tuple[int, int]]: A list of frame and record indices in the tracking chain.
        """
        tracking_chain: list[tuple[int, int]] = []
        for frame in self.get_materialized_tracking_chain(tracker_id).frames:
            if frame.record_idx is not None:
                tracking_chain.append((frame.frame_idx, frame.record_idx))

        return tracking_chain
