"""Schemas de indicadores de resultado."""
from pydantic import BaseModel
from app.schemas.common import Fuente


class IndicadorOut(BaseModel):
    clave: str
    dominio: str                      # calidad | empleabilidad | permanencia
    etiqueta: str | None = None
    valor: float | None = None
    unidad: str | None = None
    anio: int
    grano: str | None = None
    fuente: Fuente

    model_config = {"from_attributes": True}


class IndicadoresResultado(BaseModel):
    entidad_tipo: str                 # institucion | programa
    codigo_snies: str
    nombre: str
    indicadores: list[IndicadorOut]


class IndicadoresResource(BaseModel):
    data: IndicadoresResultado
