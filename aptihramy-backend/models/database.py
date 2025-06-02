from pydantic import BaseModel


class Manifest(BaseModel):
    graph: str | None = None
    dataframes_years: list[str] | None = None
    normalized_dataframes_years: list[str] | None = None


class DatabaseStatus(BaseModel):
    ready: bool = False
    error: str | None = None
