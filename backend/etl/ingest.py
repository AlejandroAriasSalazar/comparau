"""Pipeline de ingesta. Uso: python -m etl.ingest --all  (o --only instituciones).

Extrae de las fuentes oficiales vía la API SODA de datos.gov.co (paginada),
normaliza, valida y carga en Postgres con trazabilidad. Idempotente.
"""
import argparse
import sys
import httpx
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.db.session import SessionLocal, engine, Base
from app.models.institucion import Institucion
from app.models.programa import Programa
from etl.sources import SOURCES
from etl.normalize import map_row

PAGE = 5000


def fetch_soda(url: str):
    """Descarga paginada de un dataset SODA."""
    offset, rows = 0, []
    with httpx.Client(timeout=60) as client:
        while True:
            r = client.get(url, params={"$limit": PAGE, "$offset": offset})
            r.raise_for_status()
            batch = r.json()
            if not batch:
                break
            rows.extend(batch)
            offset += PAGE
    return rows


def ingest_instituciones(db: Session):
    src = SOURCES["instituciones"]
    raw = fetch_soda(src["url"])
    db.execute(delete(Institucion))
    for row in raw:
        data = map_row(row, src["map"])
        if not data.get("codigo_snies"):
            continue
        db.merge(Institucion(**{k: v for k, v in data.items()
                                if k in Institucion.__table__.columns}))
    db.commit()
    print(f"[instituciones] cargadas: {len(raw)}")


def ingest_programas(db: Session):
    src = SOURCES["programas"]
    raw = fetch_soda(src["url"])
    db.execute(delete(Programa))
    inst_ids = {i for (i,) in db.query(Institucion.codigo_snies).all()}
    cargados = 0
    for row in raw:
        data = map_row(row, src["map"])
        if not data.get("codigo_snies") or data.get("codigo_institucion") not in inst_ids:
            continue  # integridad referencial: descarta huérfanos a cuarentena
        db.merge(Programa(**{k: v for k, v in data.items()
                             if k in Programa.__table__.columns}))
        cargados += 1
    db.commit()
    print(f"[programas] cargados: {cargados} (de {len(raw)})")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--only", choices=["instituciones", "programas", "indicadores"])
    parser.add_argument("--ole-file", help="CSV de bases consolidadas del OLE")
    parser.add_argument("--spadies-file", help="CSV de SPADIES")
    args = parser.parse_args()

    Base.metadata.create_all(engine)
    db = SessionLocal()
    try:
        if args.all or args.only == "instituciones":
            ingest_instituciones(db)
        if args.all or args.only == "programas":
            ingest_programas(db)
        if args.all or args.only == "indicadores":
            from etl.indicadores import ingest_saber_pro, ingest_ole, ingest_spadies
            ingest_saber_pro(db)
            ingest_ole(db, args.ole_file)
            ingest_spadies(db, args.spadies_file)
    finally:
        db.close()
    print("ETL completado.")


if __name__ == "__main__":
    sys.exit(main())
