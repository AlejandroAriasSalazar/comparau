"""Endpoint /comparar — matriz entidad × indicador. Ver DISENO_API.md §11.10."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.comparar import construir_comparacion

router = APIRouter()


@router.get("/comparar", summary="Comparar instituciones o programas lado a lado")
def comparar(
    db: Session = Depends(get_db),
    tipo: str = Query(..., enum=["instituciones", "programas"]),
    ids: str = Query(..., description="2 a 5 códigos SNIES separados por coma"),
    indicadores: str | None = Query(None, description="Subconjunto de indicadores"),
    anio: int | None = None,
):
    codigos = [c.strip() for c in ids.split(",") if c.strip()]
    if not (2 <= len(codigos) <= 5):
        raise HTTPException(status_code=422, detail="Debe comparar entre 2 y 5 entidades.")
    seleccion = [i.strip() for i in indicadores.split(",")] if indicadores else None
    return construir_comparacion(db, tipo, codigos, seleccion, anio)
