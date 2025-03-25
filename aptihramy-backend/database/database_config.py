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

db_instance = Database(
    record_schema=RECORD_SCHEMA,
    path_graph=PATH_GRAPH,
    csv_path=CSV_PATH,
    start_year=START_YEAR,
    end_year=END_YEAR,
)


def get_database() -> Database:
    return db_instance
