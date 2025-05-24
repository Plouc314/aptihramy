import asyncio
import uvicorn

from auth.commands import create_user
from auth.db import create_db_and_tables


async def main():
    await create_db_and_tables()
    await create_user(
        email="bob@gmail.com",
        password="1234",
        is_superuser=True,
    )


if __name__ == "__main__":
    # asyncio.run(main())
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=False)
