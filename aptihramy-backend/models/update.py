from datetime import datetime
from typing import List
from sqlalchemy import Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from pydantic import BaseModel
from blitzbeaver.literals import Element


class Base(DeclarativeBase):
    """Base class for declarative models."""

    pass


class UpdateBatchSchema(Base):
    __tablename__ = "update_batches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    author: Mapped[str] = mapped_column(String, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    accepted: Mapped[bool] = mapped_column(Boolean, nullable=False)

    # Relationship to UpdateEntrySchema
    entries: Mapped[List["UpdateEntrySchema"]] = relationship(
        "UpdateEntrySchema", back_populates="batch", cascade="all, delete-orphan"
    )


class UpdateEntrySchema(Base):
    __tablename__ = "update_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    batch_id: Mapped[int] = mapped_column(
        ForeignKey("update_batches.id"), nullable=False
    )
    frame_idx: Mapped[int] = mapped_column(Integer, nullable=False)
    record_idx: Mapped[int] = mapped_column(Integer, nullable=False)
    field_idx: Mapped[int] = mapped_column(Integer, nullable=False)
    value: Mapped[str] = mapped_column(String, nullable=False)

    # Relationship back to batch
    batch: Mapped[UpdateBatchSchema] = relationship(
        "UpdateBatchSchema", back_populates="entries"
    )


class UpdateEntry(BaseModel):
    frame_idx: int
    record_idx: int
    field_idx: int
    value: Element


class UpdateBatch(BaseModel):
    id: int | None = None
    author: str
    entries: List[UpdateEntry]
    accepted: bool
    timestamp: datetime
