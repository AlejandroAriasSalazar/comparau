"""comparaU.com API — punto de entrada FastAPI."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import settings
from app.api.v1.router import api_router

app = FastAPI(
    title="comparaU.com API",
    version="1.1.0",
    description="API de comparación de la educación superior de Colombia. Solo datos oficiales.",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1024)

app.include_router(api_router, prefix="/v1")


@app.get("/", include_in_schema=False)
def root():
    return {"name": "comparaU.com API", "version": "1.1.0", "docs": "/docs"}
