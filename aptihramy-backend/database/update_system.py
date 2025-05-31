from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import selectinload
from sqlalchemy import select

import blitzbeaver as bb
from blitzbeaver.literals import Element

from models.update import (
    Base,
    UpdateBatchSchema,
    UpdateEntrySchema,
    UpdateEntry,
    UpdateBatch,
)


class UpdateSystem:

    def __init__(self, db_url: str, record_schema: bb.RecordSchema):
        self._record_schema = record_schema
        self._engine: AsyncEngine = create_async_engine(db_url)
        self._async_session = async_sessionmaker(
            bind=self._engine, expire_on_commit=False, class_=AsyncSession
        )

    def _serialize_value(self, value: Element, field_idx: int) -> str:
        field = self._record_schema.fields[field_idx]
        if field.dtype == bb.ElementType.String:
            return value
        elif field.dtype == bb.ElementType.MultiStrings:
            return "\0".join(value)

    def _deserialize_value(self, value: str, field_idx: int) -> Element:
        field = self._record_schema.fields[field_idx]
        if field.dtype == bb.ElementType.String:
            return value
        elif field.dtype == bb.ElementType.MultiStrings:
            return value.split("\0")

    async def initialize(self) -> None:
        """
        Create all tables in the database.
        """
        async with self._engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async def add_update_batch(self, batch: UpdateBatch) -> int:
        """
        Insert a new UpdateBatch and its entries into the database.
        """

        async with self._async_session() as session:
            session: AsyncSession
            async with session.begin():
                # Map Pydantic batch to SQLAlchemy model
                batch_record = UpdateBatchSchema(
                    author=batch.author,
                    timestamp=batch.timestamp,
                    accepted=batch.accepted,
                )

                # Map each Pydantic entry to SQLAlchemy model
                for entry in batch.entries:
                    entry_record = UpdateEntrySchema(
                        frame_idx=entry.frame_idx,
                        record_idx=entry.record_idx,
                        field_idx=entry.field_idx,
                        value=self._serialize_value(entry.value, entry.field_idx),
                    )
                    batch_record.entries.append(entry_record)

                # Add and flush to assign an ID
                session.add(batch_record)
                await session.flush()

                # Retrieve the generated batch ID
                new_batch_id = batch_record.id

        return new_batch_id

    async def get_update_batch(self, batch_id: int) -> UpdateBatch | None:
        """
        Retrieve an UpdateBatch by ID, including its entries.
        """
        async with self._async_session() as session:
            session: AsyncSession
            result = await session.execute(
                select(UpdateBatchSchema)
                .options(selectinload(UpdateBatchSchema.entries))
                .where(UpdateBatchSchema.id == batch_id)
            )
            batch = result.scalars().first()
            if not batch:
                return None

            entries = [
                UpdateEntry(
                    frame_idx=entry.frame_idx,
                    record_idx=entry.record_idx,
                    field_idx=entry.field_idx,
                    value=self._deserialize_value(entry.value, entry.field_idx),
                )
                for entry in batch.entries
            ]
            return UpdateBatch(
                author=batch.author,
                entries=entries,
                accepted=batch.accepted,
                timestamp=batch.timestamp,
            )

    async def remove_update_batch(self, batch_id: int) -> bool:
        """
        Remove an UpdateBatch and its entries by ID.
        """
        async with self._async_session() as session:
            async with session.begin():
                batch = await session.get(UpdateBatchSchema, batch_id)
                if not batch:
                    return False
                await session.delete(batch)
        return True

    async def mark_batch_accepted(self, batch_id: int) -> bool:
        """
        Mark an UpdateBatch as accepted.
        """
        async with self._async_session() as session:
            session: AsyncSession
            async with session.begin():
                batch = await session.get(UpdateBatchSchema, batch_id)
                if not batch:
                    return False
                batch.accepted = True
                await session.flush()
        return True

    async def get_unaccepted_batch_ids(self) -> list[int]:
        """
        Retrieve all IDs of UpdateBatch records that have not been accepted.

        :return: list of batch IDs where accepted is False
        """
        async with self._async_session() as session:
            result = await session.execute(
                select(UpdateBatchSchema.id).where(UpdateBatchSchema.accepted == False)
            )
            ids = result.scalars().all()
        return ids

    async def get_record_entries(
        self, frame_idx: int, record_idx: int
    ) -> list[UpdateEntry]:
        """
        Retrieve all UpdateEntry records matching a given frame_idx and record_idx.

        :param frame_idx: frame index to filter by
        :param record_idx: record index to filter by
        :return: list of matching UpdateEntrySchema instances
        """
        async with self._async_session() as session:
            result = await session.execute(
                select(UpdateEntrySchema)
                .where(UpdateEntrySchema.frame_idx == frame_idx)
                .where(UpdateEntrySchema.record_idx == record_idx)
            )
            entries: list[UpdateEntrySchema] = result.scalars().all()
        return [
            UpdateEntry(
                frame_idx=entry.frame_idx,
                record_idx=entry.record_idx,
                field_idx=entry.field_idx,
                value=self._deserialize_value(entry.value, entry.field_idx),
            )
            for entry in entries
        ]
