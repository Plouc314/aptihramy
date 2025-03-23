from fastapi import FastAPI, Depends, Query, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, File, UploadFile, HTTPException
from blitzbeaver.literals import ID
from fastapi.responses import FileResponse
from database import Database
import os
from database_config import get_database
from constants import COLUMN_RAW_TO_PRETTY, COLUMN_PRETTY_TO_RAW
from pydantic import BaseModel
from typing import Dict, List
import time as time
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from typing import Dict
import ast
import json

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FilterResponse(BaseModel):
    data: Dict[ID, List[List[str]]]


class FilterRequest(BaseModel):
    data: Dict[str, str]


@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}


@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "query": q}


@app.get("/schema")
def get_schema():
    return "oui"


FOLDER_PATH = "pages"


@app.get("/images/{filename}")
async def get_image(filename: str):
    file_path = os.path.join(FOLDER_PATH, filename)
    if os.path.exists(file_path):
        return FileResponse(
            file_path, media_type="image/jpeg"
        )  # Adjust media type as needed
    return {"error": "File not found"}


@app.get("/filter")
def filter_data(
    filters: str,
    db: Database = Depends(get_database),
):
    feature_search_value = json.loads(filters)
    raw_feature_search_value = {}
    for feature, search_value in feature_search_value.items():
        raw_feature = COLUMN_PRETTY_TO_RAW.get(feature)
        if raw_feature is None:
            raise HTTPException(
                status_code=400, detail=f"Invalid feature name: {feature}"
            )
        raw_feature_search_value[raw_feature] = [search_value]

    # Fetch matching trackers from the database
    matching_trackers = db.get_filtred_trackers_multiple_features(
        raw_feature_search_value
    )
    data = db.get_all_memory_from_last_frame_for_trackers(matching_trackers)
    return FilterResponse(data=data)


@app.get("/features")
def get_tracked_features(db: Database = Depends(get_database)):
    raw_features, pretty_features = db.get_tracked_features()
    return {"raw_features": raw_features, "pretty_features": pretty_features}


@app.get("/tracker")
async def get_tracker_id_information(tracker_id_1: int, tracker_id_2: int):
    tracker_id: ID = tuple(tracker_id_1, tracker_id_2)
    return {"item_id": tracker_id}
