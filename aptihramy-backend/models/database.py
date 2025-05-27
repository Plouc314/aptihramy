from pydantic import BaseModel


class Manifest(BaseModel):
    is_graph: bool
    dataframes_years: list[str] | None
    normalized_dataframes_years: list[str] | None


class DatabaseStatus(BaseModel):
    ready: bool = False
    error: str | None = None
