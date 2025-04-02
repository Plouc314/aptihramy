from pydantic import BaseModel
from typing import Dict, List


class RecordModel(BaseModel):
    records: Dict[str, List[str | int | float | None]]
