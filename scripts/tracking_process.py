"""
This script executes the tracking process on given CSV files and saves the tracking graph.

RECORD_SCHEMA can be modified to match the structure of the CSV files being processed.
In get_tracking_config, the default configuration can be modified directly instead of using a configuration file.
"""

import argparse
import json
import os
import re
import logging
import time
import blitzbeaver as bb
import polars as pl

logger = logging.getLogger()

RECORD_SCHEMA = bb.RecordSchema(
    [
        bb.FieldSchema("nom_rue_norm", bb.ElementType.String),
        bb.FieldSchema("chef_prenom_norm", bb.ElementType.String),
        bb.FieldSchema("chef_nom_norm", bb.ElementType.String),
        bb.FieldSchema("chef_origine", bb.ElementType.String),
        bb.FieldSchema("epouse_nom", bb.ElementType.String),
        bb.FieldSchema("chef_vocation", bb.ElementType.String),
        bb.FieldSchema("enfants_chez_parents_prenom", bb.ElementType.MultiStrings),
    ]
)


def get_tracking_config(
    record_schema: bb.RecordSchema,
    path_config: str | None,
    num_threads: int,
) -> bb.TrackingConfig:
    """Get the configuration for the tracking process.

    Args:
        record_schema (bb.RecordSchema): The schema to use for the records.
        path_config (str | None): Optional path to a configuration file. If provided, it will be used to load the configuration.
        num_threads (int): The number of threads to use for the tracking process.

    Returns:
        bb.TrackingConfig: The configuration for the tracking process.
    """
    if path_config is not None:
        if not os.path.exists(path_config):
            logger.error(f"Configuration file not found: {path_config}")
            quit(1)

        with open(path_config, "r") as f:
            raw_config = json.load(f)

        config = bb.deserialize_tracking_config(raw_config)
        logger.info(f"Loaded tracking configuration from {path_config}.")
        return config

    distance_metric_config = bb.DistanceMetricConfig(
        metric="lv_substring",
        caching_threshold=4,
        use_sigmoid=False,
        lv_substring_weight=0.7,
    )
    normal_memory_config = bb.MemoryConfig(
        memory_strategy="ls-median",
    )
    multi_memory_config = bb.MemoryConfig(
        memory_strategy="mw-median",
        multiword_threshold_match=0.8,
        multiword_distance_metric=distance_metric_config,
    )

    config = bb.config(
        record_schema=record_schema,
        distance_metric_config=distance_metric_config,
        record_scorer_config=bb.RecordScorerConfig(
            record_scorer="weighted-average",
            weights=[
                0.15,
                0.25,
                0.25,
                0.15,
                0.15,
                0.15,
                0.15,
            ],
            min_weight_ratio=0.7,
        ),
        resolver_config=bb.ResolverConfig(
            resolving_strategy="best-match",
        ),
        memory_config=normal_memory_config,
        multistring_memory_config=multi_memory_config,
        interest_threshold=0.79,
        limit_no_match_streak=4,
        num_threads=num_threads,
    )

    return config


def preprocess_dataframe(
    df: pl.DataFrame, record_schema: bb.RecordSchema
) -> pl.DataFrame:
    """Preprocess the DataFrame to ensure it meets the requirements for tracking.

    In particular, we need to cap string values to a maximum of 256 characters to avoid issues in the computation of the Levenshtein distance.

    Args:
        df (pl.DataFrame): The DataFrame to preprocess.

    Returns:
        pl.DataFrame: The preprocessed DataFrame.
    """
    columns = []

    for field in record_schema.fields:
        if field.dtype == bb.ElementType.String:
            columns.append(df[field.name].str.slice(0, 255).alias(field.name))
        elif field.dtype == bb.ElementType.MultiStrings:
            columns.append(
                df[field.name]
                .str.split("|")
                .list.eval(pl.element().filter(pl.element() != "").slice(0, 255))
                .alias(field.name)
            )

    return df.with_columns(columns)


def load_dataframes(path: str, record_schema: bb.RecordSchema) -> list[pl.DataFrame]:
    """Load the DataFrames from the specified path and preprocess them.

    Args:
        path (str): The path to the directory containing the CSV files.
        record_schema (bb.RecordSchema): The schema to use for preprocessing.

    Returns:
        list[pl.DataFrame]: A list of preprocessed DataFrames.
    """
    logger.info(f"Loading CSV files from {path}...")

    dataframes = []
    for filename in os.listdir(path):
        if not re.match(r"^\d{4}\.csv$", filename):
            logger.error("The CSV filenames must be in format YYYY.csv.")
            quit(1)
        df = pl.read_csv(os.path.join(path, filename), infer_schema_length=10000)
        df = preprocess_dataframe(df, record_schema)
        dataframes.append(df)

    logger.info(f"Loaded {len(dataframes)} dataframes.")

    return dataframes


def execute_tracking_process(
    path_csv: str,
    path_graph: str,
    path_tracking_config: str | None,
    record_schema: bb.RecordSchema,
    num_threads: int,
    log_level: bb.LogLevel,
) -> None:
    """Execute the tracking process.

    Args:
        path_csv (str): The path to the directory containing the CSV files.
        path_graph (str): The file path where the tracking graph will be saved.
        path_tracking_config (str | None): Optional path to a configuration file for the tracking process.
        record_schema (bb.RecordSchema): The schema to use for preprocessing.
        num_threads (int): The number of threads to use for the tracking process.
        config (bb.TrackingConfig): The configuration for the tracking process.
    """
    dataframes = load_dataframes(path_csv, record_schema)

    config = get_tracking_config(record_schema, path_tracking_config, num_threads)

    logger.info("Starting tracking process...")
    st = time.time()
    graph = bb.execute_tracking(config, record_schema, dataframes, log_level)
    et = time.time() - st
    logger.info(f"Tracking process completed in {et:.2f} seconds.")

    bb.save_beaver(path_graph, graph)
    logger.info(f"Graph saved to {path_graph}.")


def main():
    parser = argparse.ArgumentParser(
        description="Executes the tracking process on given CSV files and saves the tracking graph.",
    )

    parser.add_argument(
        "-c",
        "--csv",
        type=str,
        required=True,
        help="Path to the directory containing the CSV files.",
    )

    parser.add_argument(
        "-g",
        "--graph",
        type=str,
        default="./graph.beaver",
        help="File path where the tracking graph will be saved (default: ./graph.beaver).",
    )

    parser.add_argument(
        "-t",
        "--threads",
        type=int,
        default=os.cpu_count(),
        help=f"Number of threads to use (default: number of CPU cores = {os.cpu_count()}).",
    )

    parser.add_argument(
        "-l",
        "--log",
        type=str,
        choices=["debug", "info", "warn", "error"],
        default="info",
        help="Log level (default: info).",
    )

    parser.add_argument(
        "--config",
        type=str,
        required=False,
        help="Optional path to a configuration file in JSON format.",
    )

    args = parser.parse_args()

    logging.basicConfig(
        level=args.log.upper(), format="%(asctime)s [%(levelname)s] %(message)s"
    )

    execute_tracking_process(
        path_csv=args.csv,
        path_graph=args.graph,
        path_tracking_config=args.config,
        record_schema=RECORD_SCHEMA,
        num_threads=args.threads,
        log_level=args.log,
    )


if __name__ == "__main__":
    main()
