"""Endpoints de Programas: listado con filtros y detalle."""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select, func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.programa import Programa
from app.schemas.common import Fuente, MetaColeccion, Paginacion
from app.schemas.institucion import ProgramaOut, ProgramaCollection

router = APIRouter()


def _to_out(p: Programa) -> ProgramaOut:
    return ProgramaOut(
        codigo_snies=p.codigo_snies, nombre=p.nombre, codigo_institucion=p.codigo_institucion,
        titulo_otorgado=p.titulo_otorgado, nivel_academico=p.nivel_academico,
        nivel_formacion=p.nivel_formacion, area_conocimiento=p.area_conocimiento, nbc=p.nbc,
        metodologia=p.metodologia, creditos=p.creditos, estado=p.estado,
        acreditado=p.acreditado, descripcion=p.descripcion,
        fuente=Fuente(sistema="SNIES", dataset="MEN_PROGRAMAS_DE_EDUCACIÓN_SUPERIOR",
                      dataset_id="upr9-nkiz", url="https://www.datos.gov.co/d/upr9-nkiz"),
    )


@router.get("", response_model=ProgramaCollection, summary="Listar programas")
def list_programas(
    response: Response,
    db: Session = Depends(get_db),
    q: str | None = None,
    codigo_institucion: str | None = None,
    nivel_academico: str | None = Query(None, enum=["Pregrado", "Posgrado"]),
    nbc: str | None = None,
    metodologia: str | None = None,
    estado: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    stmt = select(Programa)
    if q:
        stmt = stmt.where(Programa.nombre.ilike(f"%{q}%"))
    if codigo_institucion:
        stmt = stmt.where(Programa.codigo_institucion == codigo_institucion)
    if nivel_academico:
        stmt = stmt.where(Programa.nivel_academico == nivel_academico)
    if nbc:
        stmt = stmt.where(Programa.cod_nbc == nbc)
    if metodologia:
        stmt = stmt.where(Programa.metodologia == metodologia)
    if estado:
        stmt = stmt.where(Programa.estado == estado)

    total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    rows = db.scalars(stmt.order_by(Programa.nombre).limit(limit).offset(offset)).all()

    response.headers["Cache-Control"] = "public, max-age=86400"
    return ProgramaCollection(
        data=[_to_out(p) for p in rows],
        meta=MetaColeccion(
            paginacion=Paginacion(total=total, limit=limit,
                                  siguiente=str(offset + limit) if offset + limit < total else None),
            generado_en=datetime.utcnow()),
    )


@router.get("/{codigo_snies}", response_model=ProgramaOut, summary="Obtener programa")
def get_programa(codigo_snies: str, db: Session = Depends(get_db)):
    p = db.get(Programa, codigo_snies)
    if not p:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    return _to_out(p)
