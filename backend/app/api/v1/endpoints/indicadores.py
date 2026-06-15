"""Endpoints de indicadores de resultado (Saber Pro, OLE, SPADIES)."""
from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.institucion import Institucion
from app.models.programa import Programa, Indicador
from app.schemas.common import Fuente
from app.schemas.indicador import IndicadorOut, IndicadoresResultado, IndicadoresResource

router = APIRouter()

_FUENTE = {
    "calidad": Fuente(sistema="ICFES", dataset="Resultados únicos Saber Pro", dataset_id="u37r-hjmu",
                      url="https://www.datos.gov.co/d/u37r-hjmu"),
    "empleabilidad": Fuente(sistema="OLE", url="https://ole.mineducacion.gov.co"),
    "permanencia": Fuente(sistema="SPADIES",
                          url="https://www.mineducacion.gov.co/sistemasinfo/spadies"),
}


def _indicadores(db: Session, entidad_tipo: str, codigo: str,
                 anio: int | None, dominio: str | None) -> list[IndicadorOut]:
    stmt = select(Indicador).where(
        Indicador.entidad_tipo == entidad_tipo, Indicador.codigo_snies == codigo)
    if anio:
        stmt = stmt.where(Indicador.anio == anio)
    if dominio:
        stmt = stmt.where(Indicador.dominio == dominio)
    out = []
    for i in db.scalars(stmt.order_by(Indicador.dominio, Indicador.anio.desc())).all():
        out.append(IndicadorOut(
            clave=i.clave, dominio=i.dominio, etiqueta=i.etiqueta, valor=i.valor,
            unidad=i.unidad, anio=i.anio, grano=i.grano,
            fuente=_FUENTE.get(i.dominio, Fuente(sistema="SNIES"))))
    return out


@router.get("/instituciones/{codigo_snies}/indicadores", response_model=IndicadoresResource,
            tags=["Indicadores"], summary="Indicadores de resultado de una institución")
def indicadores_institucion(
    codigo_snies: str, response: Response, db: Session = Depends(get_db),
    anio: int | None = None,
    dominio: str | None = Query(None, enum=["calidad", "empleabilidad", "permanencia"]),
):
    inst = db.get(Institucion, codigo_snies)
    if not inst:
        raise HTTPException(status_code=404, detail="Institución no encontrada")
    response.headers["Cache-Control"] = "public, max-age=86400"
    return IndicadoresResource(data=IndicadoresResultado(
        entidad_tipo="institucion", codigo_snies=codigo_snies, nombre=inst.nombre,
        indicadores=_indicadores(db, "institucion", codigo_snies, anio, dominio)))


@router.get("/programas/{codigo_snies}/indicadores", response_model=IndicadoresResource,
            tags=["Indicadores"], summary="Indicadores de resultado de un programa")
def indicadores_programa(
    codigo_snies: str, response: Response, db: Session = Depends(get_db),
    anio: int | None = None,
):
    prog = db.get(Programa, codigo_snies)
    if not prog:
        raise HTTPException(status_code=404, detail="Programa no encontrado")
    response.headers["Cache-Control"] = "public, max-age=86400"
    return IndicadoresResource(data=IndicadoresResultado(
        entidad_tipo="programa", codigo_snies=codigo_snies, nombre=prog.nombre,
        indicadores=_indicadores(db, "programa", codigo_snies, anio, None)))
