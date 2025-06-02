# Aptihramy (Automated Person Tracking In Historical Records Across Multiple Years)

## Getting Started

### Development Environment Setup

* Create a `.env` file in the root directory of the project with the following content:
  ```env
  PATH_DATA_FOLDER="../data"
  FASTAPI_SERVE_FRONTEND="false"
  AUTH_SECRET="my-secret"
  ```

* Create a `.env` file in the `aptihramy-frontend` directory with the following content:
  ```env
  VITE_FASTAPI_URL="http://localhost:5000"
  ```

* Start the backend server:  
  in `aptihramy-backend`:
  ```bash
  uvicorn api:app --host 0.0.0.0 --port 5000
  ```

* Start the frontend server:  
  in `aptihramy-frontend`:
  ```bash
  npm run dev
  ```

* Start the production server:  
  ```bash
  docker compose up --build
  ```
  The production server listen on port 8000, it serves both the backend endpoints and the frontend.

## Backend

### Authentication system

The authentication system is based on the [FastAPI Users](https://github.com/fastapi-users/fastapi-users) library.

