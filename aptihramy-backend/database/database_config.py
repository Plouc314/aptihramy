from fastapi import FastAPI
import uvicorn
from database import Database
import polars as pl
import blitzbeaver as bb
import time as time

CSV_PATH = "../../aptihramy/data/csv_cleaned"
PATH_GRAPH = "./beaver_files/graph.beaver"
START_YEAR = 1805
END_YEAR = 1810
RECORD_SCHEMA = bb.RecordSchema(
    [
        bb.FieldSchema("nom_rue_norm", bb.ElementType.String),
        bb.FieldSchema("chef_prenom_norm", bb.ElementType.String),
        bb.FieldSchema("chef_nom_norm", bb.ElementType.String),
        bb.FieldSchema("chef_origine", bb.ElementType.String),
        bb.FieldSchema("epouse_nom", bb.ElementType.String),
        bb.FieldSchema("chef_vocation", bb.ElementType.String),
    ]
)

TRACKING_CONFIG = bb.TrackingConfig(
    num_threads=17,
    tracker=bb.TrackerConfig(
        interest_threshold=0.6,
        limit_no_match_streak=3,
        memory_strategy="median",
        record_scorer=bb.RecordScorerConfig(
            record_scorer="weighted-average",
            weights=[
                0.15,
                0.25,
                0.25,
                0.1,
                0.1,
                0.1,
            ],
            min_weight_ratio=0.7,
        ),
    ),
    distance_metric=bb.DistanceMetricConfig(
        metric="lv_opti",
        caching_threshold=4,
        lv_substring_weight=0.5,
    ),
    resolver=bb.ResolverConfig(
        resolving_strategy="best-match",
    ),
)


db_instance = Database(
    record_schema=RECORD_SCHEMA,
    tracking_config=TRACKING_CONFIG,
    path_graph=PATH_GRAPH,
    csv_path=CSV_PATH,
    start_year=START_YEAR,
    end_year=END_YEAR,
)


def get_database() -> Database:
    return db_instance
