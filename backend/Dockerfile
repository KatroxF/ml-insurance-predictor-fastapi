FROM python:3.11-slim

WORKDIR /app

COPY backend /app/backend

ENV PYTHONPATH=/app

RUN pip install --no-cache-dir -r backend/requirements.txt

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "10000"]