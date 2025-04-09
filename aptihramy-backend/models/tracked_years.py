from pydantic import BaseModel
from typing import Dict, List


class TrackedYearsModel(BaseModel):
    tracked_years: List[int]
