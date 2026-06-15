"""ETL de indicadores de resultado: Saber Pro (ICFES), OLE y SPADIES.

Saber Pro se publica como MICRODATOS anonimizados (un registro por estudiante).
comparaU NUNCA expone registros individuales: aquí se agregan a PROMEDIOS por
institución/programa antes de cargarlos. OLE y SPADIES se distribuyen como bases
consolidadas (no SODA); este módulo deja el punto de extracción y el mapeo listos.

Ver DISENO_API.md §8 (privacidad) y §11.10 (integridad de la comparación).
"""
from __future__ import annotations
import httpx
import pandas as pd
from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.programa import Indicador

SABER_PRO_URL = "https://www.datos.gov.co/resource/u37r-hjmu.json"

# Mapeo de la clave interna → (dominio, etiqueta, unidad, grano)
META = {
    "saber_pro_promedio_global": ("calidad", "Saber Pro — promedio global", "puntos", "institucion"),
    "empleabilidad_tasa_vinculacion": ("empleabilidad", "Tasa de vinculación laboral", "porcentaje", "institucion"),
    "ingreso_mediano_enganche": ("empleabilidad", "Ingreso mediano de enganche", "COP/mes", "institucion"),
    "desercion_anual": ("permanencia", "Deserción anual", "porcentaje", "institucion"),
    "tasa_graduacion": ("permanencia", "Tasa de graduación", "porcentaje", "institucion"),
}


def _upsert(db: Session, entidad_tipo: str, codigo: str, clave: str, valor: float | None, anio: int):
    dominio, etiqueta, unidad, grano = META[clave]
    db.add(Indicador(entidad_tipo=entidad_tipo, codigo_snies=str(codigo), clave=clave,
                     dominio=dominio, etiqueta=etiqueta, valor=valor, unidad=unidad,
                     anio=anio, grano=grano))


def ingest_saber_pro(db: Session, anio: int | None = None):
    """Descarga microdatos Saber Pro y los agrega a promedio global por institución."""
    params = {"$limit": 50000, "$select": "inst_cod_institucion,mod_razona_cuantitat_punt,"
              "mod_lectura_critica_punt,mod_competen_ciudada_punt,mod_ingles_punt,periodo"}
    with httpx.Client(timeout=120) as client:
        r = client.get(SABER_PRO_URL, params=params)
        r.raise_for_status()
        df = pd.DataFrame(r.json())
    if df.empty:
        print("[saber_pro] sin datos")
        return
    cols = ["mod_razona_cuantitat_punt", "mod_lectura_critica_punt",
            "mod_competen_ciudada_punt", "mod_ingles_punt"]
    for c in cols:
        df[c] = pd.to_numeric(df.get(c), errors="coerce")
    df["global"] = df[cols].mean(axis=1)
    df["anio"] = pd.to_numeric(df["periodo"].astype(str).str[:4], errors="coerce")
    if anio:
        df = df[df["anio"] == anio]
    # Agregación: promedio por institución (>=20 registros para no exponer grupos pequeños)
    agg = (df.dropna(subset=["inst_cod_institucion", "global"])
             .groupby(["inst_cod_institucion", "anio"])
             .agg(promedio=("global", "mean"), n=("global", "size"))
             .reset_index())
    agg = agg[agg["n"] >= 20]
    db.execute(delete(Indicador).where(Indicador.clave == "saber_pro_promedio_global"))
    for _, row in agg.iterrows():
        _upsert(db, "institucion", row["inst_cod_institucion"],
                "saber_pro_promedio_global", round(float(row["promedio"]), 1), int(row["anio"]))
    db.commit()
    print(f"[saber_pro] instituciones con promedio: {len(agg)}")


def ingest_ole(db: Session, path: str | None = None):
    """OLE: empleabilidad e ingreso de enganche. Base consolidada (CSV/XLSX del portal OLE).

    Descarga manual desde ole.mineducacion.gov.co → 'tablas de salida'. Mapea las
    columnas 'tasa de cotización' e 'IBC mediano' por institución/año.
    """
    if not path:
        print("[ole] omitido: provee el archivo de bases consolidadas del OLE (--ole-file)")
        return
    df = pd.read_csv(path)  # ajustar separador/encoding según el archivo oficial
    db.execute(delete(Indicador).where(Indicador.dominio == "empleabilidad"))
    for _, row in df.iterrows():
        cod = row.get("codigo_institucion")
        anio = int(row.get("anio", 0)) or 0
        _upsert(db, "institucion", cod, "empleabilidad_tasa_vinculacion",
                _num(row.get("tasa_vinculacion")), anio)
        _upsert(db, "institucion", cod, "ingreso_mediano_enganche",
                _num(row.get("ibc_mediano")), anio)
    db.commit()
    print(f"[ole] filas: {len(df)}")


def ingest_spadies(db: Session, path: str | None = None):
    """SPADIES: deserción y graduación. Base consolidada del MEN (consulta pública)."""
    if not path:
        print("[spadies] omitido: provee el archivo de SPADIES (--spadies-file)")
        return
    df = pd.read_csv(path)
    db.execute(delete(Indicador).where(Indicador.dominio == "permanencia"))
    for _, row in df.iterrows():
        cod = row.get("codigo_institucion")
        anio = int(row.get("anio", 0)) or 0
        _upsert(db, "institucion", cod, "desercion_anual", _num(row.get("desercion_anual")), anio)
        _upsert(db, "institucion", cod, "tasa_graduacion", _num(row.get("tasa_graduacion")), anio)
    db.commit()
    print(f"[spadies] filas: {len(df)}")


def _num(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return None
