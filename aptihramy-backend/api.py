import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from blitzbeaver.literals import ID, Element
from fastapi.responses import FileResponse
from database import Database
from constants import (
    COLUMN_PRETTY_TO_RAW,
    FOLDER_PATH,
    RECORD_SCHEMA,
    PATH_MANIFEST,
    PATH_GRAPH,
    PATH_DATAFRAMES,
    PATH_NORMALIZED_DATAFRAMES,
)
from models import (
    FilterRequest,
    FilterResponse,
    RecordModel,
    TrackingChainModel,
    TrackerDiagnosticsModel,
    TrackedYearsModel,
    MaterializedTrackingChainModel,
)

from auth.routers import setup_auth_routes
from auth.db import create_db_and_tables

db = Database(
    RECORD_SCHEMA,
    PATH_MANIFEST,
    PATH_GRAPH,
    PATH_DATAFRAMES,
    PATH_NORMALIZED_DATAFRAMES,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_db_and_tables()
    db.initialize()
    yield


app = FastAPI(lifespan=lifespan)

setup_auth_routes(app)

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
def get_tracked_features():
    raw_features, pretty_features = db.get_tracked_features()
    return {"raw_features": raw_features, "pretty_features": pretty_features}


@app.get("/tracker")
def get_tracker_id_information(
    tracker_id: int,
):
    return TrackerDiagnosticsModel.tracker_diagnostics_to_base_model(
        db.get_diagnostics(tracker_id)
    )


@app.get("/tracking_chain")
def get_tracking_chain(
    tracker_id: int,
):
    return TrackingChainModel.tracking_chain_to_base_model(
        db.get_tracking_chain(tracker_id)
    )


@app.get("/materialized_frames")
def get_materialized_frames(
    tracker_id: int,
):
    materialized_chain = db.get_materialized_tracking_chain(tracker_id)
    frame_idx_rec_idxs = db.get_frame_idx_record_idxs_from_materialized_chain(
        materialized_chain
    )

    # frame idx -> record idx -> raw values [value_of_feature1, value_of_feature2)
    raw_values: dict[tuple[int, int], list[Element]] = {}
    # frame idx -> record idx -> raw values [value_of_feature1, value_of_feature2)

    normalized_values: dict[tuple[int, int], list[Element]] = {}
    for frame_idx, record_idxs in frame_idx_rec_idxs.items():
        for record_idx in record_idxs:
            raw_values[(frame_idx, record_idx)] = (
                db.get_raw_values_for_frame_idx_record_idx(frame_idx, record_idx)
            )
            normalized_values[(frame_idx, record_idx)] = (
                db.get_normalized_values_for_frame_idx_record_idx(frame_idx, record_idx)
            )

    return MaterializedTrackingChainModel.from_materialized_tracking_chain(
        materialized_chain, raw_values, normalized_values
    )


@app.get("/record")
def get_record_values(
    frame_idx: int,
    record_idx: int,
):
    try:
        return RecordModel(records=db.get_record(frame_idx, record_idx))
    except Exception:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid frame index: {frame_idx} or record index: {record_idx}",
        )


@app.get("/tracked_years")
def get_tracked_years():
    return TrackedYearsModel(tracked_years=db.get_tracked_years())
