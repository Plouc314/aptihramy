from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from blitzbeaver.literals import ID
from fastapi.responses import FileResponse
from database import Database
import os
from database import get_database
from constants import COLUMN_RAW_TO_PRETTY, COLUMN_PRETTY_TO_RAW, FOLDER_PATH
from models import (
    FilterRequest,
    FilterResponse,
    RecordModel,
    TrackedYearsModel,
    tracker_diagnostics_to_base_model,
    tracking_chain_to_base_model,
)
import ast
import time

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Hello, FastAPI!"}


@app.get("/images/{filename}")
async def get_image(filename: str):
    file_path = os.path.join(FOLDER_PATH, filename)
    if os.path.exists(file_path):
        return FileResponse(
            file_path, media_type="image/jpeg"
        )  # Adjust media type as needed
    return {"error": "File not found"}


@app.post("/filter")
def filter_data(
    request: FilterRequest,
    db: Database = Depends(get_database),
):
    """
    Filters data based on provided feature search values.

    Args:
        request (FilterRequest): JSON request body containing feature filters.
        db (Database): Dependency-injected database instance.

    Returns:
        FilterResponse: Response containing the filtered data.
    """
    feature_search_value = request.filters
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
def get_tracker_id_information(tracker_id: str, db: Database = Depends(get_database)):
    id = ast.literal_eval(tracker_id)
    if not isinstance(id, tuple):
        raise HTTPException(status_code=400, detail=f"Invalid tracker id: {tracker_id}")
    return tracker_diagnostics_to_base_model(db.get_diagnostics(id))


@app.get("/tracking_chain")
def get_tracking_chain(tracker_id: str, db: Database = Depends(get_database)):
    id = ast.literal_eval(tracker_id)
    if not isinstance(id, tuple):
        raise HTTPException(status_code=400, detail=f"Invalid tracker id: {tracker_id}")

    return tracking_chain_to_base_model(db.get_tracking_chain(id))


@app.get("/record")
def get_record_values(
    frame_idx: str, record_idx: str, db: Database = Depends(get_database)
):
    try:
        raw_tracked_features, _ = db.get_tracked_features()
        df = db.get_record(int(frame_idx), int(record_idx)).select(raw_tracked_features)
        return RecordModel(records=df.to_dict(as_series=False))
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid frame index: {frame_idx} or record index: {record_idx}",
        )


@app.get("/tracked_years")
def get_tracked_years(db: Database = Depends(get_database)):
    return TrackedYearsModel(tracked_years=db.get_tracked_years())
