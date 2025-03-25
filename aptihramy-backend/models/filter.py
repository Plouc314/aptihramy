from blitzbeaver.literals import ID
from pydantic import BaseModel
from typing import Dict, List


class FilterResponse(BaseModel):
    data: Dict[ID, List[List[str]]]


class FilterRequest(BaseModel):
    filters: Dict[str, str]
