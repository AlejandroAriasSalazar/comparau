"""Endpoints de Instituciones: listado con filtros y detalle."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.institucion import Institucion
from app.schemas.common import Fuente, MetaColeccion, Paginacion
from app.schemas.institucion import (
    InstitucionOut, InstitucionCollection, Ubicacion, AcreditacionInstitucional,
)

router = APIRouter()


def _to_out(i: Institucion) -> InstitucionOut:
    return InstitucionOut(
        codigo_snies=i.codigo_snies, nombre=i.nombre, sigla=i.sigla, nit=i.nit,
        sector=i.sector, caracter_academico=i.caracter_academico,
        naturaleza_juridica=i.naturaleza_juridica, principal_seccional=i.principal_seccional,
        estado=i.estado, sitio_web=i.sitio_web, telefono=i.telefono,
        domicilio=Ubicacion(direccion=i.direccion, municipio=i.municipio,
                            cod_municipio=i.cod_municipio, departamento=i.departamento,
                            cod_departamento=i.cod_departamento),
        acreditacion_institucional=AcreditacionInstitucional(
            acreditada=i.acreditada, resolucion=i.acreditacion_resolucion,
            fecha=i.acreditacion_fecha, vigencia_anios=i.acreditacion_vigencia_anios),
        fuente=Fuente(sistema="SNIES", dataset="MEN_INSTITUCIONES EDUCACIÓN SUPERIOR",
                      dataset_id="n5yy-8nav", url="https://www.datos.gov.co/d/n5yy-8nav",
                      fecha_actualizacion=i.fecha_actualizacion),
    )


@router.get("", response_model=InstitucionCollection, summary="Listar instituciones (IES)")
def list_instituciones(
    response: Response,
    db: Session = Depends(get_db),
    q: str | None = Query(None, description="Búsqueda por nombre"),
    sector: str | None = Query(None, enum=["Oficial", "Privado"]),
    caracter_academico: str | None = None,
    departamento: str | None = Query(None, description="Cód. DIVIPOLA departamento"),
    acreditada_alta_calidad: bool | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    stmt = select(Institucion)
    if q:
        stmt = stmt.where(Institucion.nombre.ilike(f"%{q}%"))
    if sector:
        stmt = stmt.where(Institucion.sector == sector)
    if caracter_academico:
        stmt = stmt.where(Institucion.caracter_academico == caracter_academico)
    if departamento:
        stmt = stmt.where(Institucion.cod_departamento == departamento)
    if acreditada_alta_calidad is not None:
        stmt = stmt.where(Institucion.acreditada == acreditada_alta_calidad)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(stmt.order_by(Institucion.nombre).limit(limit).offset(offset)).all()

    response.headers["Cache-Control"] = "public, max-age=86400"
    return InstitucionCollection(
        data=[_to_out(i) for i in rows],
        meta=MetaColeccion(
            paginacion=Paginacion(total=total, limit=limit,
                                  siguiente=str(offset + limit) if offset + limit < total else None),
            generado_en=datetime.utcnow(),
        ),
    )


@router.get("/{codigo_snies}", response_model=InstitucionOut, summary="Obtener institución")
def get_institucion(codigo_snies: str, db: Session = Depends(get_db)):
    i = db.get(Institucion, codigo_snies)
    if not i:
        raise HTTPException(status_code=404, detail="Institución no encontrada")
    return _to_out(i)
