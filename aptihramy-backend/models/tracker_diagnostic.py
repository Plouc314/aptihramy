from pydantic import BaseModel
from blitzbeaver.literals import ID
from typing import List, Optional, Union
from blitzbeaver import (
    TrackerDiagnostics,
    TrackerFrameDiagnostics,
    TrackerRecordDiagnostics,
)


class TrackerRecordDiagnosticsModel(BaseModel):
    record_idx: int
    record_score: float
    distances: list[Optional[float]]


class TrackerFrameDiagnosticsModel(BaseModel):
    frame_idx: int
    records: list[TrackerRecordDiagnosticsModel]
    memory: list[list[str]]


class TrackerDiagnosticsModel(BaseModel):
    id: ID
    frames: list[TrackerFrameDiagnosticsModel]


class TrackerDiagnosticsResponse(BaseModel):
    diagnostic: TrackerDiagnosticsModel | None


def tracker_record_to_base_model(
    t: TrackerRecordDiagnostics,
) -> TrackerRecordDiagnosticsModel:
    return TrackerRecordDiagnosticsModel(
        record_idx=t.record_idx, record_score=t.record_score, distances=t.distances
    )


def tracker_frame_to_base_model(
    t: TrackerFrameDiagnostics,
) -> TrackerFrameDiagnosticsModel:
    return TrackerFrameDiagnosticsModel(
        frame_idx=t.frame_idx,
        records=[tracker_record_to_base_model(record) for record in t.records],
        memory=t.memory,
    )


def tracker_diagnostics_to_base_model(
    d: TrackerDiagnostics | None
) -> TrackerDiagnosticsResponse:
    
    if d is None:
        return TrackerDiagnosticsResponse(diagnostic=None)
    
    tracker_diagnostics_model = TrackerDiagnosticsModel(
        id=d.id, frames=[tracker_frame_to_base_model(frame) for frame in d.frames]
    )
    return TrackerDiagnosticsResponse(diagnostic=tracker_diagnostics_model)
