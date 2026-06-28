# ── Etapa 1: Build del frontend ──────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend-web/package*.json ./
RUN npm ci
COPY frontend-web/ .
RUN npm run build

# ── Etapa 2: Backend Python ───────────────────────────────────────────────────
FROM python:3.12-slim
WORKDIR /app

# Dependencias del sistema
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq-dev gcc && rm -rf /var/lib/apt/lists/*

# Dependencias Python
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Código del backend
COPY backend/ .

# Frontend build → carpeta static/
COPY --from=frontend-builder /frontend/dist ./static

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
