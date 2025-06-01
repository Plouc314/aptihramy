import uuid
from fastapi import Depends, FastAPI
from fastapi_users import BaseUserManager

from .schemas import UserCreate, UserRead, UserUpdate
from .users import auth_backend, fastapi_users, get_user_manager, current_super_user
from .db import User


def setup_auth_routes(app: FastAPI) -> None:
    """
    Setup authentication routes for the FastAPI application.
    """

    app.include_router(
        fastapi_users.get_auth_router(auth_backend), prefix="/auth/jwt", tags=["auth"]
    )
    # Note: disable user registration, users have to be created by an admin
    # app.include_router(
    #     fastapi_users.get_register_router(UserRead, UserCreate),
    #     prefix="/auth",
    #     tags=["auth"],
    # )
    app.include_router(
        fastapi_users.get_users_router(UserRead, UserUpdate),
        prefix="/users",
        tags=["users"],
    )

    @app.post("/auth/create-user", tags=["auth"])
    async def create_user(
        user: UserCreate,
        active_user: User = Depends(current_super_user),
        user_manager: BaseUserManager[User, uuid.UUID] = Depends(get_user_manager),
    ) -> UserRead:
        """
        Create a new user.
        """
        created_user = await user_manager.create(user)
        return created_user
