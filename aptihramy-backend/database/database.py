import polars as pl
import blitzbeaver as bb
from blitzbeaver.literals import ID
from blitzbeaver import TrackerDiagnostics
from constants import COLUMN_RAW_TO_PRETTY, COLUMN_PRETTY_TO_RAW
import time as time


class Database:

    def __init__(
        self,
        record_schema: bb.RecordSchema,
        path_graph: str,
        csv_path: str,
        start_year: int,
        end_year: int,
    ):
        """
        Initializes the Database instance.

        Args:
            record_schema (bb.RecordSchema): The schema defining the records.
            path_graph (str): Path to the Beaver diagnostic graph file.
            csv_path (str): Path to the folder containing CSV data used to create the beaver file.
            start_year (int): The starting year of the dataset.
            end_year (int): The ending year of the dataset.
        """
        self._record_schema = record_schema
        self._path_graph = path_graph
        self._csv_path = csv_path
        self._start_year = start_year
        self._end_year = end_year
        self._graph = bb.read_beaver(path_graph)
        self._feature_indexes = self._get_feature_indexes()
        self._feature_last_frame_value = self._build_last_frame_values()

    def _get_feature_indexes(self) -> dict[str, int]:
        d = {}
        for i, field in enumerate(self._record_schema.fields):
            d[field.name] = i
        return d

    def _get_last_frame_values_for_all_features(self) -> dict[str, dict[ID, list[str]]]:
        d = {}
        for schema in self._record_schema.fields:
            d[schema.name] = self.get_last_frame_values_of_feature(schema.name)
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

    def get_dataframes(self) -> list[pl.DataFrame]:
        """
        Reads CSV files for each year in the range and returns them as a list of Polars DataFrames.

        Returns:
            list[pl.DataFrame]: A list of DataFrames loaded from CSV files.
        """
        return [
            pl.read_csv(f"{self._csv_path}/{year}.csv", infer_schema_length=10000)
            for year in range(self._start_year, self._end_year + 1)
        ]

    def get_feature_index(self, raw_feature: str) -> int | None:
        return self._feature_indexes.get(raw_feature)

    def get_last_frame_values_of_feature(
        self, raw_feature: str
    ) -> dict[ID, list[str]] | None:
        """
        Retrieves the values of the last frame for a feature for all trackers.

        Args:
            raw_feature (str): The raw feature name.

        Returns:
            dict[ID, list[str]] | None: A dictionary mapping tracker IDs to
            their last recorded feature values, or None if the feature is not found.
        """
        return self._feature_last_frame_value.get(raw_feature)

    def _get_last_frame_values_of_feature(
        self, raw_feature: str
    ) -> dict[ID, list[str]] | None:
        """
        Retrieves the values of the last frame for a feature for all trackers.

        Args:
            raw_feature (str): The raw feature name.

        Returns:
            dict[ID, list[str]] | None: A dictionary mapping tracker IDs to
            their last recorded feature values, or None if the feature is not found.
        """
        feature_index = self.get_feature_index(raw_feature)
        if feature_index is None:
            return None

        tracker_feature_mem = {}

        for tracker_id, tracker_diagnostic in self._graph.diagnostics.trackers.items():
            if len(tracker_diagnostic.frames) > 0:
                last_diagnostic = tracker_diagnostic.frames[-1]
                tracker_feature_mem[tracker_id] = last_diagnostic.memory[feature_index]

        return tracker_feature_mem


    def get_diagnostics(self, tracker_id: ID) -> TrackerDiagnostics | None:
        return self._graph.diagnostics.get_tracker(tracker_id)

    def get_all_memory_from_last_frame_for_tracker(
        self, tracker_id: ID
    ) -> list[list[str]]:
        """
        Retrieves the memory stored in the last frame for a specific tracker.

        Args:
            tracker_id (ID): The tracker ID.

        Returns:
            list[list[str]]: The memory contents from the last frame of the tracker.
        """
        tracker = self._graph.diagnostics.get_tracker(tracker_id)
        return tracker.frames[-1].memory if tracker else []

    def get_all_memory_from_last_frame_for_trackers(
        self, tracker_ids: list[ID]
    ) -> dict[ID, list[list[str]]]:
        ret = {}
        for tracker_id in tracker_ids:
            ret[tracker_id] = self.get_all_memory_from_last_frame_for_tracker(
                tracker_id
            )
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
