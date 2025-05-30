FROM node:22-alpine AS frontend-builder

WORKDIR /app-frontend

COPY aptihramy-frontend/package*.json ./
RUN npm install

ENV VITE_FASTAPI_URL=""

COPY aptihramy-frontend/ .
RUN npm run build

FROM python:3.11-slim-bullseye

WORKDIR /app/

COPY ./requirements.txt /app/

RUN pip install --upgrade pip && \
    pip install -r requirements.txt

COPY aptihramy-backend /app/

RUN mkdir /app/public
COPY --from=frontend-builder /app-frontend/dist/ /app/public/

RUN mkdir /app/data

CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]