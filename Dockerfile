FROM python:3.11-slim-bullseye

WORKDIR /app/

COPY ./requirements.txt /app/

RUN pip install --upgrade pip && \
    pip install -r requirements.txt

COPY aptihramy-backend /app/src

CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8000"]