# Source: https://github.com/fastapi-users/fastapi-users/blob/master/examples/sqlalchemy/app/schemas.py

import uuid

from fastapi_users import schemas


class UserRead(schemas.BaseUser[uuid.UUID]):
    pass


class UserCreate(schemas.BaseUserCreate):
    pass


class UserUpdate(schemas.BaseUserUpdate):
    pass
