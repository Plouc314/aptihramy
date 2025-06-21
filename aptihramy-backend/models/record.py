from blitzbeaver.literals import ID, Element
from pydantic import BaseModel
from typing import Dict, List, Optional


class FrameRecordPair(BaseModel):
    frame_idx: int
    record_idx: int


class RecordRequest(BaseModel):
    pairs: List[FrameRecordPair]


class RecordModel(BaseModel):
    raw_values: list[Element]
    normalized_values: list[Element]


class RecordResult(BaseModel):
    frame_idx: int
    record_idx: int
    values: Optional[RecordModel] = None
    error: Optional[str] = None


class RecordsResponse(BaseModel):
    results: List[RecordResult]
