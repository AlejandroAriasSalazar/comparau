"""Schemas Pydantic compartidos: paginación, fuente, problema (RFC 9457)."""
from datetime import date, datetime
from pydantic import BaseModel


class Fuente(BaseModel):
    sistema: str
    dataset: str | None = None
    dataset_id: str | None = None
    url: str | None = None
    licencia: str | None = "CC BY-SA 4.0"
    fecha_actualizacion: date | None = None


class Paginacion(BaseModel):
    total: int
    limit: int
    cursor_actual: str | None = None
    siguiente: str | None = None
    anterior: str | None = None


class MetaColeccion(BaseModel):
    paginacion: Paginacion
    generado_en: datetime


class Problem(BaseModel):
    """RFC 9457 Problem Details."""
    type: str = "about:blank"
    title: str
    status: int
    detail: str | None = None
    instance: str | None = None
