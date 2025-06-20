from pydantic import BaseModel
from typing import List
from blitzbeaver.literals import Element
from blitzbeaver import (
    MaterializedTrackerFrame,
    MaterializedTrackingChain,
    TrackerRecordDiagnostics,
    TrackerFrameDiagnostics,
)


class RecordDiagnosticsModel(BaseModel):
    record_score: float
    distances: list[float | None]

    @staticmethod
    def from_tracker_record_diagnostics(
        diagnostic: TrackerRecordDiagnostics,
    ):
        return RecordDiagnosticsModel(
            record_score=diagnostic.record_score,
            distances=diagnostic.distances,
        )


class MaterializedRecordModel(BaseModel):
    record_idx: int
    record_raw_values: list[Element]
    record_normalized_values: list[Element]
    record_diagnostics: RecordDiagnosticsModel | None


class MaterializedFrameModel(BaseModel):
    frame_idx: int
    matching_record_idx: int | None
    records: list[MaterializedRecordModel]
    memory: list[list[str]] | None

    @staticmethod
    def get_materialized_record_models(
        frame: MaterializedTrackerFrame,
        raw_values: dict[tuple[int, int], list[Element]],
        normalized_values: dict[tuple[int, int], list[Element]],
    ) -> list[MaterializedRecordModel] | None:

        matching_record_idx = frame.record_idx
        if matching_record_idx is None and frame.frame_diagnostic is None:
            return None

        record_diagnostics: list[TrackerRecordDiagnostics] = []

        # matching_record_idx is None => frame.frame_diagnostic is not None
        # No matching record, take the candidates
        # The candidates records are stored in the frame diagnostic
        if matching_record_idx is None:
            record_diagnostics = frame.frame_diagnostic.records

        else:
            # Matching record but no diagnostic (first frame)
            if frame.frame_diagnostic is None:
                return [
                    MaterializedRecordModel(
                        record_idx=matching_record_idx,
                        record_raw_values=raw_values[
                            (frame.frame_idx, matching_record_idx)
                        ],
                        record_normalized_values=normalized_values[
                            (frame.frame_idx, matching_record_idx)
                        ],
                        record_diagnostics=None,
                    )
                ]
            # Matching record and diagnostic (matching record and maybe other candidates)
            # Put the matching record first
            else:
                first_record = None
                for r in frame.frame_diagnostic.records:
                    if r.record_idx == matching_record_idx:
                        first_record = r
                    else:
                        record_diagnostics.append(r)

                if first_record is None:
                    return None

                # Put the matching record in first position
                record_diagnostics.insert(0, first_record)

        return [
            MaterializedRecordModel(
                record_idx=diagnostic.record_idx,
                record_raw_values=raw_values[(frame.frame_idx, diagnostic.record_idx)],
                record_normalized_values=normalized_values[
                    (frame.frame_idx, diagnostic.record_idx)
                ],
                record_diagnostics=RecordDiagnosticsModel.from_tracker_record_diagnostics(
                    diagnostic
                ),
            )
            for diagnostic in record_diagnostics
        ]

    @staticmethod
    def from_materialized_tracker_frame(
        frame: MaterializedTrackerFrame,
        raw_values: dict[tuple[int, int], list[Element]],
        normalized_values: dict[tuple[int, int], list[Element]],
    ) -> "MaterializedFrameModel | None":

        matching_record_idx = frame.record_idx

        records = MaterializedFrameModel.get_materialized_record_models(
            frame, raw_values, normalized_values
        )

        if records is None or len(records) == 0:
            return None

        mem = None if frame.frame_diagnostic is None else frame.frame_diagnostic.memory

        return MaterializedFrameModel(
            frame_idx=frame.frame_idx,
            matching_record_idx=matching_record_idx,
            records=records,
            memory=mem,
        )


class MaterializedTrackingChainModel(BaseModel):
    frames: list[MaterializedFrameModel] | None

    @staticmethod
    def from_materialized_tracking_chain(
        chain: MaterializedTrackingChain,
        raw_values: dict[tuple[int, int], list[Element]],
        normalized_values: dict[tuple[int, int], list[Element]],
    ) -> "MaterializedTrackingChainModel":
        frames = []
        for c in chain.frames:
            m = MaterializedFrameModel.from_materialized_tracker_frame(
                c, raw_values, normalized_values
            )
            if m is not None:
                frames.append(m)

        return MaterializedTrackingChainModel(frames=frames)
