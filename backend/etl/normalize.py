"""Normalización: centinelas → null, tipado, sí/no → bool, mapeo de columnas."""
from datetime import datetime
from etl.sources import SENTINELS


def clean(value):
    if value is None:
        return None
    v = str(value).strip()
    return None if v in SENTINELS else v


def to_bool(value) -> bool:
    return clean(value) in {"SI", "Si", "si", "true", "True", "1"}


def to_int(value):
    v = clean(value)
    try:
        return int(float(v)) if v is not None else None
    except (ValueError, TypeError):
        return None


def to_date(value):
    v = clean(value)
    if not v:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y-%m-%dT%H:%M:%S.%f"):
        try:
            return datetime.strptime(v, fmt).date()
        except ValueError:
            continue
    return None


def map_row(raw: dict, mapping: dict) -> dict:
    """Aplica el mapeo columna_origen → campo_modelo y limpia centinelas."""
    out = {}
    for field, src in mapping.items():
        out[field] = clean(raw.get(src))
    # Coerciones específicas
    if "acreditada" in out:
        out["acreditada"] = to_bool(raw.get(mapping["acreditada"]))
    for k in ("creditos", "numero_periodos", "acreditacion_vigencia_anios",
              "anios_acreditados"):
        if k in out:
            out[k] = to_int(out[k])
    for k in ("acreditacion_fecha", "fecha_creacion", "fecha_actualizacion"):
        if k in out:
            out[k] = to_date(out[k])
    # Normaliza URL de sitio web
    if out.get("sitio_web") and not out["sitio_web"].startswith("http"):
        out["sitio_web"] = "https://" + out["sitio_web"].lstrip("/")
    return out
