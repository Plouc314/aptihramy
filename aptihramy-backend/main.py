from fastapi import FastAPI
import uvicorn
from database import Database
import polars as pl
import blitzbeaver as bb
import time as time
from database_config import (
    RECORD_SCHEMA,
    TRACKING_CONFIG,
    PATH_GRAPH,
    CSV_PATH,
    START_YEAR,
    END_YEAR,
)


def create_beaver_file(
    record_schema: bb.RecordSchema,
    tracking_config: bb.TrackerConfig,
    path_graph: str,
    csv_path: str,
    start_year: int,
    end_year: int,
):
    dataframes = [
        pl.read_csv(f"{csv_path}/{year}.csv", infer_schema_length=10000)
        for year in range(start_year, end_year + 1)
    ]
    graph = bb.execute_tracking(tracking_config, record_schema, dataframes, "debug")
    bb.save_beaver(path_graph, graph)


if __name__ == "__main__":

    # create_beaver_file(
    #     RECORD_SCHEMA, TRACKING_CONFIG, PATH_GRAPH, CSV_PATH, START_YEAR, END_YEAR
    # )
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)
