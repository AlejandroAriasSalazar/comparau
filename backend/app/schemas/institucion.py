"""Schemas de respuesta para Institución y Programa."""
from datetime import date
from pydantic import BaseModel
from app.schemas.common import Fuente, MetaColeccion


class Ubicacion(BaseModel):
    direccion: str | None = None
    municipio: str | None = None
    cod_municipio: str | None = None
    departamento: str | None = None
    cod_departamento: str | None = None


class AcreditacionInstitucional(BaseModel):
    acreditada: bool = False
    resolucion: str | None = None
    fecha: date | None = None
    vigencia_anios: int | None = None


class InstitucionOut(BaseModel):
    codigo_snies: str
    nombre: str
    sigla: str | None = None
    nit: str | None = None
    sector: str
    caracter_academico: str
    naturaleza_juridica: str | None = None
    principal_seccional: str | None = None
    estado: str | None = None
    sitio_web: str | None = None
    telefono: str | None = None
    domicilio: Ubicacion
    acreditacion_institucional: AcreditacionInstitucional
    fuente: Fuente

    model_config = {"from_attributes": True}


class InstitucionCollection(BaseModel):
    data: list[InstitucionOut]
    meta: MetaColeccion


class ProgramaOut(BaseModel):
    codigo_snies: str
    nombre: str
    codigo_institucion: str
    titulo_otorgado: str | None = None
    nivel_academico: str
    nivel_formacion: str | None = None
    area_conocimiento: str | None = None
    nbc: str | None = None
    metodologia: str | None = None
    creditos: int | None = None
    estado: str | None = None
    acreditado: bool = False
    descripcion: str | None = None
    fuente: Fuente

    model_config = {"from_attributes": True}


class ProgramaCollection(BaseModel):
    data: list[ProgramaOut]
    meta: MetaColeccion
