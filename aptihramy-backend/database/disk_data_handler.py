from io import BytesIO
import json
import os
import re
import threading
import zipfile
import polars as pl
from typing import BinaryIO, Callable

import blitzbeaver as bb
from models.database import Manifest, DiskDataStatus
from models.update import UpdateBatch
from exceptions import AptihramyException


class DiskDataHandler:

    def __init__(
        self,
        record_schema: bb.RecordSchema,
        path_manifest: str,
        path_graph: str,
        path_dataframes: str,
        path_normalized_dataframes: str,
    ):
        self.record_schema = record_schema
        self._path_manifest = path_manifest
        self._path_graph = path_graph
        self._path_dataframes = path_dataframes
        self._path_normalized_dataframes = path_normalized_dataframes
        self._manifest: Manifest | None = None
        self._graph: bb.TrackingGraph | None = None
        self._dataframes: list[pl.DataFrame] | None = None
        self._normalized_dataframes: list[pl.DataFrame] | None = None
        self._on_graph_change_callbacks: list[Callable[[bb.TrackingGraph], None]] = []
        self._lock: threading.Lock = threading.Lock()

    @property
    def manifest(self) -> Manifest | None:
        """
        Returns the manifest if it exists.
        """
        return self._manifest

    @property
    def graph(self) -> bb.TrackingGraph | None:
        """
        Returns the tracking graph if it exists.
        """
        return self._graph

    @property
    def dataframes(self) -> list[pl.DataFrame] | None:
        """
        Returns the list of dataframes if they exist.
        """
        return self._dataframes

    @property
    def normalized_dataframes(self) -> list[pl.DataFrame] | None:
        """
        Returns the list of normalized dataframes if they exist.
        """
        return self._normalized_dataframes

    def initialize(self) -> None:
        if not os.path.exists(self._path_manifest):
            self._manifest = Manifest()
            self._save_manifest()

        self._manifest = self._load_manifest()

        if self._manifest.graph is not None:
            self._graph = self._load_graph(self._manifest.graph)

        if self._manifest.dataframes_years is not None:
            self._dataframes = self._load_dataframes(
                self._path_dataframes, self._manifest.dataframes_years
            )

        if self._manifest.normalized_dataframes_years is not None:
            self._normalized_dataframes = self._load_dataframes(
                self._path_normalized_dataframes,
                self._manifest.normalized_dataframes_years,
            )

    def _load_manifest(self) -> Manifest:
        with open(self._path_manifest, "r") as file:
            return Manifest(**json.load(file))

    def _load_graph(self, graph_filename: str) -> bb.TrackingGraph:
        """
        Loads a tracking graph from a .beaver file.

        Args:
            graph_filename (str): The name of the .beaver file containing the tracking graph.

        Returns:
            TrackingGraph: The loaded tracking graph.
        """
        graph = bb.read_beaver(f"{self._path_graph}/{graph_filename}")
        return graph

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
        dfs = [
            pl.read_csv(f"{csv_path}/{year}.csv", infer_schema_length=10000)
            for year in years
        ]
        return dfs

    def get_disk_data_status(self) -> DiskDataStatus:
        """
        Checks the status of the disk data and returns a DiskDataStatus object.
        Returns:
            DiskDataStatus: An object indicating whether the disk data complete and consistent or if there are errors.
        """
        if self._manifest.dataframes_years is None:
            return DiskDataStatus(error="Missing dataframes.")
        if self._manifest.normalized_dataframes_years is None:
            return DiskDataStatus(error="Missing normalized dataframes.")
        if (
            self._manifest.dataframes_years
            != self._manifest.normalized_dataframes_years
        ):
            return DiskDataStatus(
                error="Dataframes years do not match normalized dataframes years."
            )
        if self._manifest.graph is None:
            return DiskDataStatus(error="Missing tracking graph.")
        return DiskDataStatus(ready=True)

    def save_graph(self, zip_file: BinaryIO) -> None:
        """
        Save the tracking graph from a zip file containing a single .beaver file.
        """
        with zipfile.ZipFile(zip_file, "r") as zip_ref:
            filenames = zip_ref.namelist()
            if len(filenames) != 1 or not filenames[0].endswith(".beaver"):
                raise AptihramyException(
                    "The zip file must contain a single .beaver file."
                )
            self._manifest.graph = filenames[0]
            zip_ref.extract(filenames[0], self._path_graph)

        self._graph = self._load_graph(self._manifest.graph)

        # notify all registered callbacks about the graph change
        for callback in self._on_graph_change_callbacks:
            callback(self._graph)

        self._save_manifest()

    def save_dataframes(self, zip_file: BinaryIO, normalized: bool) -> None:
        """
        Save dataframes from a zip file containing CSV files in format YYYY.csv.
        If is_normalized is True, saves to the normalized dataframes path.
        """
        if normalized:
            path_dataframes = self._path_normalized_dataframes
        else:
            path_dataframes = self._path_dataframes
        years = []
        with zipfile.ZipFile(zip_file, "r") as zip_ref:
            filenames = zip_ref.namelist()
            for filename in filenames:
                if not re.match(r"^\d{4}\.csv$", filename):
                    raise AptihramyException(
                        "The zip file must contain CSV files in format YYYY.csv."
                    )
                year = filename.split(".")[0]
                zip_ref.extract(filename, path_dataframes)
                years.append(year)

        if normalized:
            self._manifest.normalized_dataframes_years = years
            self._normalized_dataframes = self._load_dataframes(
                self._path_normalized_dataframes, years
            )
        else:
            self._manifest.dataframes_years = years
            self._dataframes = self._load_dataframes(self._path_dataframes, years)
        self._save_manifest()

    def _save_manifest(self) -> None:
        """
        Saves the current manifest to the manifest file.
        """
        with open(self._path_manifest, "w") as file:
            json.dump(self._manifest.model_dump(), file, indent=4)

    def create_zip_with_graph(self) -> BinaryIO:
        """
        Creates a zip file containing the tracking graph.
        Returns:
            BinaryIO: A binary stream containing the zip file with the graph.
        """
        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.write(
                f"{self._path_graph}/{self._manifest.graph}",
                arcname=self._manifest.graph,
            )
        zip_buffer.seek(0)
        return zip_buffer

    def create_zip_with_dataframes(self, normalized: bool) -> BinaryIO:
        """
        Creates a zip file containing the dataframes.
        If normalized is True, includes normalized dataframes.
        Returns:
            BinaryIO: A binary stream containing the zip file with the dataframes.
        """
        if normalized:
            path_dataframes = self._path_normalized_dataframes
            years = self._manifest.normalized_dataframes_years
        else:
            path_dataframes = self._path_dataframes
            years = self._manifest.dataframes_years

        zip_buffer = BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            for year in years:
                zip_file.write(
                    f"{path_dataframes}/{year}.csv",
                    arcname=f"{year}.csv",
                )
        zip_buffer.seek(0)
        return zip_buffer

    def apply_update_batch(
        self,
        batch: UpdateBatch,
    ) -> None:
        """
        Applies an update batch to the dataframes.
        """
        self._lock.acquire()
        try:
            modified_df_indexes = set()
            for entry in batch.entries:
                modified_df_indexes.add(entry.frame_idx)
                df = self._normalized_dataframes[entry.frame_idx]
                field = self.record_schema.fields[entry.field_idx]
                df[field.name] = df[field.name].set_at_idx(
                    entry.record_idx, entry.value
                )

            # save the modified dataframes
            for frame_idx in modified_df_indexes:
                year = self._manifest.dataframes_years[frame_idx]
                df = self._normalized_dataframes[frame_idx]
                df.write_csv(f"{self._path_normalized_dataframes}/{year}.csv")
        finally:
            self._lock.release()

    def register_on_graph_change_callback(
        self, callback: Callable[[bb.TrackingGraph], None]
    ) -> None:
        """
        Registers a callback to be called when the graph changes.
        """
        self._on_graph_change_callbacks.append(callback)
