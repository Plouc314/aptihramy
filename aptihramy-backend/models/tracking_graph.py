from pydantic import BaseModel
from typing import List
from blitzbeaver.literals import Element
from blitzbeaver import (
    MaterializedTrackerFrame,
    MaterializedTrackingChain,
    TrackerFrameDiagnostics,
    TrackerRecordDiagnostics,
)


class TrackerRecordDiagnosticsModel(BaseModel):
    record_idx: int
    record_score: float
    distances: list[float | None]

    @staticmethod
    def from_tracker_record_diagnostics(diagnostic: TrackerRecordDiagnostics):
        return TrackerRecordDiagnosticsModel(
            record_idx=diagnostic.record_idx,
            record_score=diagnostic.record_score,
            distances=diagnostic.distances,
        )


class TrackerFrameDiagnosticsModel(BaseModel):
    records: list[TrackerRecordDiagnosticsModel]
    memory: list[list[str]]

    @staticmethod
    def from_tracker_frame_diagnostics(
        frame: TrackerFrameDiagnostics | None, matching_record_idx: int
    ) -> "TrackerFrameDiagnosticsModel | None":
        if frame is None:
            return None

        first_record = None
        rest: list[TrackerRecordDiagnostics] = []
        for r in frame.records:
            if r.record_idx == matching_record_idx:
                first_record = r
            else:
                rest.append(r)

        if first_record is None:
            return None

        # Put the matching record in first position
        rest.insert(0, first_record)
        records = [
            TrackerRecordDiagnosticsModel.from_tracker_record_diagnostics(r)
            for r in rest
        ]

        return TrackerFrameDiagnosticsModel(records=records, memory=frame.memory)


class MaterializedTrackerFrameModel(BaseModel):
    frame_idx: int
    matching_record_idx: int
    frame_diagnostic: TrackerFrameDiagnosticsModel | None

    @staticmethod
    def from_materialized_tracker_frame(
        frame: MaterializedTrackerFrame,
    ) -> "MaterializedTrackerFrameModel | None":
        if frame.record_idx is None:
            return None

        diagnostic = TrackerFrameDiagnosticsModel.from_tracker_frame_diagnostics(
            frame.frame_diagnostic, frame.record_idx
        )

        return MaterializedTrackerFrameModel(
            frame_idx=frame.frame_idx,
            matching_record_idx=frame.record_idx,
            frame_diagnostic=diagnostic,
        )


class MaterializedTrackingChainModel(BaseModel):
    frames: list[MaterializedTrackerFrameModel] | None

    @staticmethod
    def from_materialized_tracking_chain(
        chain: MaterializedTrackingChain,
    ) -> "MaterializedTrackingChainModel":
        frames = []
        for c in chain.frames:
            m = MaterializedTrackerFrameModel.from_materialized_tracker_frame(c)
            if m is not None:
                frames.append(m)

        return MaterializedTrackingChainModel(frames=frames)
