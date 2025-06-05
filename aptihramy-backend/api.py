import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles

from blitzbeaver.literals import ID, Element
from dotenv import load_dotenv

load_dotenv()

import auth
from database import DiskDataHandler, DataService, FLFVCache, UpdateSystem
from constants import (
    COLUMN_PRETTY_TO_RAW,
    RECORD_SCHEMA,
    PATH_IMAGES,
    PATH_MANIFEST,
    PATH_GRAPH,
    PATH_DATAFRAMES,
    PATH_NORMALIZED_DATAFRAMES,
    DB_URL_UPDATE_SYSTEM,
)
from models import (
    FilterRequest,
    FilterResponse,
    RecordModel,
    TrackingChainModel,
    TrackerDiagnosticsModel,
    TrackedYearsModel,
    MaterializedTrackingChainModel,
    DiskDataStatus,
    UpdateBatch,
    UpdateEntry,
)
from exceptions import AptihramyException

FASTAPI_SERVE_FRONTEND = (
    os.environ.get("FASTAPI_SERVE_FRONTEND", "false").lower() == "true"
)

ddh = DiskDataHandler(
    RECORD_SCHEMA,
    PATH_MANIFEST,
    PATH_GRAPH,
    PATH_DATAFRAMES,
    PATH_NORMALIZED_DATAFRAMES,
)

update_system = UpdateSystem(
    DB_URL_UPDATE_SYSTEM,
    RECORD_SCHEMA,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await auth.setup_auth_database()
    await update_system.initialize()
    ddh.initialize()
    ddh.register_on_graph_change_callback(FLFVCache.clear)
    yield


app = FastAPI(lifespan=lifespan)

auth.setup_auth_routes(app)

if FASTAPI_SERVE_FRONTEND:
    app.mount("/app", StaticFiles(directory="public", html=True), name="public")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get(
    "/api",
)
def hello_world():
    return {"message": "Hello world!"}


@app.get(
    "/api/check-token",
    dependencies=[Depends(auth.current_active_user)],
)
def check_token() -> None:
    return None


@app.get(
    "/api/disk-data-status",
    dependencies=[Depends(auth.current_active_user)],
)
def check_disk_data_status() -> DiskDataStatus:
    return ddh.get_disk_data_status()


@app.post("/api/upload/graph", dependencies=[Depends(auth.current_super_user)])
def upload_graph(file: UploadFile) -> None:
    try:
        ddh.save_graph(file.file)
    except AptihramyException as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.post("/api/upload/dataframes", dependencies=[Depends(auth.current_super_user)])
def upload_dataframes(file: UploadFile, normalized: bool = False) -> None:
    try:
        ddh.save_dataframes(file.file, normalized=normalized)
    except AptihramyException as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/api/download/graph", dependencies=[Depends(auth.current_active_user)])
def download_graph():
    """
    Download the tracking graph as a zip file.
    """
    if ddh.graph is None:
        raise HTTPException(status_code=400, detail="Graph is missing.")
    zip_file = ddh.create_zip_with_graph()
    return StreamingResponse(
        zip_file,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=tracking_graph.zip"},
    )


@app.get("/api/download/dataframes", dependencies=[Depends(auth.current_active_user)])
def download_dataframes(normalized: bool = False):
    """
    Download dataframes as a zip file.
    If normalized is True, downloads normalized dataframes.
    """
    if (normalized and ddh.normalized_dataframes) is None or ddh.dataframes is None:
        raise HTTPException(status_code=400, detail="Dataframes are missing.")
    zip_file = ddh.create_zip_with_dataframes(normalized=normalized)

    return StreamingResponse(
        zip_file,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=dataframes.zip"},
    )


@app.post("/api/update/batch", dependencies=[Depends(auth.current_active_user)])
async def post_update_batch(
    batch: UpdateBatch,
) -> None:
    await update_system.add_update_batch(batch)


@app.get(
    "/api/update/batch/{batch_id}", dependencies=[Depends(auth.current_active_user)]
)
async def get_update_batch(batch_id: int) -> UpdateBatch:
    batch = await update_system.get_update_batch(batch_id)
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    return batch


@app.delete(
    "/api/update/batch/{batch_id}", dependencies=[Depends(auth.current_super_user)]
)
async def delete_update_batch(batch_id: int) -> None:
    if not await update_system.remove_update_batch(batch_id):
        raise HTTPException(status_code=404, detail="Batch not found")


@app.post(
    "/api/update/batch/{batch_id}/accept",
    dependencies=[Depends(auth.current_super_user)],
)
async def accept_update_batch(batch_id: int) -> None:
    batch = await update_system.get_update_batch(batch_id)
    if batch is None or batch.accepted:
        raise HTTPException(
            status_code=404, detail="Batch not found or already accepted"
        )
    await update_system.mark_batch_accepted(batch_id)
    ddh.apply_update_batch(batch)


@app.get(
    "/api/update/unaccepted-batches", dependencies=[Depends(auth.current_active_user)]
)
async def get_unaccepted_batches() -> list[int]:
    """
    Retrieve all unaccepted update batch IDs.
    """
    return await update_system.get_unaccepted_batch_ids()


@app.get("/api/update/entries", dependencies=[Depends(auth.current_active_user)])
async def get_update_entries(
    frame_idx: int,
    record_idx: int,
) -> list[UpdateEntry]:
    """
    Retrieve update entries filtered by frame_idx and record_idx.
    """
    entries = await update_system.get_record_entries(frame_idx, record_idx)
    return entries


@app.get("/api/images/{filename}")
async def get_image(filename: str):
    file_path = os.path.join(PATH_IMAGES, filename)
    if os.path.exists(file_path):
        return FileResponse(
            file_path, media_type="image/jpeg"
        )  # Adjust media type as needed
    return {"error": "File not found"}


@app.post("/api/filter", dependencies=[Depends(auth.current_active_user)])
def filter_data(
    request: FilterRequest,
    data_service: DataService = Depends(DataService.get_instance(ddh)),
):
    """
    Filters data based on provided feature search values.

    Args:
        request (FilterRequest): JSON request body containing feature filters.

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
    matching_trackers = data_service.get_filtred_trackers_multiple_features(
        raw_feature_search_value
    )

    data = data_service.get_all_memory_from_last_frame_for_trackers(matching_trackers)
    return FilterResponse(data=data)


@app.get("/api/features", dependencies=[Depends(auth.current_active_user)])
def get_tracked_features(
    data_service: DataService = Depends(DataService.get_instance(ddh)),
):
    raw_features, pretty_features = data_service.get_tracked_features()
    return {"raw_features": raw_features, "pretty_features": pretty_features}


@app.get("/api/tracker", dependencies=[Depends(auth.current_active_user)])
def get_tracker_id_information(
    tracker_id: int,
    data_service: DataService = Depends(DataService.get_instance(ddh)),
):
    return TrackerDiagnosticsModel.tracker_diagnostics_to_base_model(
        data_service.get_diagnostics(tracker_id)
    )


@app.get("/api/tracking_chain", dependencies=[Depends(auth.current_active_user)])
def get_tracking_chain(
    tracker_id: int,
    data_service: DataService = Depends(DataService.get_instance(ddh)),
):
    return TrackingChainModel.tracking_chain_to_base_model(
        data_service.get_tracking_chain(tracker_id)
    )


@app.get("/api/materialized_frames", dependencies=[Depends(auth.current_active_user)])
def get_materialized_frames(
    tracker_id: int,
    data_service: DataService = Depends(DataService.get_instance(ddh)),
):
    materialized_chain = data_service.get_materialized_tracking_chain(tracker_id)
    frame_idx_rec_idxs = data_service.get_frame_idx_record_idxs_from_materialized_chain(
        materialized_chain
    )

    # frame idx -> record idx -> raw values [value_of_feature1, value_of_feature2)
    raw_values: dict[tuple[int, int], list[Element]] = {}
    # frame idx -> record idx -> raw values [value_of_feature1, value_of_feature2)

    normalized_values: dict[tuple[int, int], list[Element]] = {}
    for frame_idx, record_idxs in frame_idx_rec_idxs.items():
        for record_idx in record_idxs:
            raw_values[(frame_idx, record_idx)] = (
                data_service.get_raw_values_for_frame_idx_record_idx(
                    frame_idx, record_idx
                )
            )
            normalized_values[(frame_idx, record_idx)] = (
                data_service.get_normalized_values_for_frame_idx_record_idx(
                    frame_idx, record_idx
                )
            )

    return MaterializedTrackingChainModel.from_materialized_tracking_chain(
        materialized_chain, raw_values, normalized_values
    )


@app.get("/api/record", dependencies=[Depends(auth.current_active_user)])
def get_record_values(
    frame_idx: int,
    record_idx: int,
    data_service: DataService = Depends(DataService.get_instance(ddh)),
):
    try:
        return RecordModel(records=data_service.get_record(frame_idx, record_idx))
    except Exception:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid frame index: {frame_idx} or record index: {record_idx}",
        )


@app.get("/api/tracked_years", dependencies=[Depends(auth.current_active_user)])
def get_tracked_years(
    data_service: DataService = Depends(DataService.get_instance(ddh)),
):
    return TrackedYearsModel(tracked_years=data_service.get_tracked_years())
