"""
This script executes the normalization process on given CSV files and tracking graph, saving the normalized dataframes to a specified output directory.

RECORD_SCHEMA can be modified to match the structure of the CSV files being processed.
NORMALIZATION_CONFIG can be modified to adjust the normalization parameters.
"""

import argparse
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

NORMALIZATION_CONFIG = bb.NormalizationConfig(
    threshold_cluster_match=0.7,
    min_cluster_size=2,
    infer_missing_clusters=False,
    distance_metric=bb.DistanceMetricConfig(
        metric="lv_substring",
        caching_threshold=4,
        use_sigmoid=False,
        lv_substring_weight=0.7,
    ),
)


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


def postprocess_df(df: pl.DataFrame, record_schema: bb.RecordSchema) -> pl.DataFrame:
    """Postprocess the DataFrame to make it compatible with CSV format.

    Args:
        df (pl.DataFrame): The DataFrame to postprocess.
        record_schema (bb.RecordSchema): The schema to use for postprocessing.
    Returns:
        pl.DataFrame: The postprocessed DataFrame.
    """

    columns = []

    for field in record_schema.fields:
        if field.dtype == bb.ElementType.String:
            columns.append(df[field.name])
        elif field.dtype == bb.ElementType.MultiStrings:
            columns.append(df[field.name].list.join("|").alias(field.name))

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


def execute_normalization_process(
    path_csv: str,
    path_graph: str,
    path_out: str,
    normalization_config: bb.NormalizationConfig,
    record_schema: bb.RecordSchema,
) -> None:
    """Execute the normalization process on the dataframes loaded from the specified path.

    Args:
        path_csv (str): The path to the directory containing the CSV files.
        path_graph (str): The path to the tracking graph in .beaver format.
        path_out (str): The path to save the normalized dataframes.
        normalization_config (bb.NormalizationConfig): The configuration for normalization.
        record_schema (bb.RecordSchema): The schema to use for preprocessing.
    """
    dataframes = load_dataframes(path_csv, record_schema)

    logger.info(f"Loading tracking graph from {path_graph}...")
    graph = bb.read_beaver(path_graph)

    logger.info("Starting normalization process...")
    st = time.time()
    normalized_dataframes = bb.execute_normalization(
        normalization_config,
        record_schema,
        graph,
        dataframes,
    )
    et = time.time() - st
    logger.info(f"Normalization process completed in {et:.2f} seconds.")

    if not os.path.exists(path_out):
        logger.info(f"Creating output directory: {path_out}")
        os.makedirs(path_out)

    logger.info(f"Saving normalized dataframes to {path_out}...")
    for df, filename in zip(normalized_dataframes, os.listdir(path_csv)):
        df = postprocess_df(df, record_schema)
        df.write_csv(os.path.join(path_out, filename))
    logger.info("Normalized dataframes saved successfully.")


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
        required=True,
        help="Path to the tracking graph in .beaver format.",
    )

    parser.add_argument(
        "-o",
        "--out",
        type=str,
        help="Directory where the normalized dataframes will be saved.",
    )

    parser.add_argument(
        "-l",
        "--log",
        type=str,
        choices=["debug", "info", "warn", "error"],
        default="info",
        help="Log level (default: info).",
    )

    args = parser.parse_args()

    logging.basicConfig(
        level=args.log.upper(), format="%(asctime)s [%(levelname)s] %(message)s"
    )

    execute_normalization_process(
        path_csv=args.csv,
        path_graph=args.graph,
        path_out=args.out,
        normalization_config=NORMALIZATION_CONFIG,
        record_schema=RECORD_SCHEMA,
    )


if __name__ == "__main__":
    main()
