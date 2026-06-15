"""Router raíz de la API v1."""
from fastapi import APIRouter
from app.api.v1.endpoints import health, instituciones, programas, comparar, indicadores

api_router = APIRouter()
api_router.include_router(health.router, tags=["Metadatos"])
api_router.include_router(instituciones.router, prefix="/instituciones", tags=["Instituciones"])
api_router.include_router(programas.router, prefix="/programas", tags=["Programas"])
api_router.include_router(indicadores.router)  # /instituciones/{id}/indicadores y /programas/{id}/indicadores
api_router.include_router(comparar.router, tags=["Comparación"])
