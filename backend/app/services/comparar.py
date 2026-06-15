"""Lógica de comparación: construye la matriz entidad × indicador con advertencias.

Principio (DISENO_API.md §11.10): comparaU NO produce un puntaje único. Cada
indicador se presenta con su año y fuente; se añaden advertencias cuando dos
valores no son estrictamente comparables (años o granos distintos).
"""
from datetime import datetime
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.institucion import Institucion
from app.models.programa import Programa, Indicador

# Dirección "mejor" para resaltar en UI (no para rankear).
MEJOR_DIRECCION = {
    "saber_pro_promedio_global": "mayor_mejor",
    "empleabilidad_tasa_vinculacion": "mayor_mejor",
    "ingreso_mediano_enganche": "mayor_mejor",
    "tasa_graduacion": "mayor_mejor",
    "desercion_anual": "menor_mejor",
}
ETIQUETAS = {
    "saber_pro_promedio_global": ("Saber Pro — promedio global", "calidad", "puntos"),
    "empleabilidad_tasa_vinculacion": ("Tasa de vinculación laboral", "empleabilidad", "porcentaje"),
    "ingreso_mediano_enganche": ("Ingreso mediano de enganche", "empleabilidad", "COP/mes"),
    "tasa_graduacion": ("Tasa de graduación", "permanencia", "porcentaje"),
    "desercion_anual": ("Deserción anual", "permanencia", "porcentaje"),
}


def construir_comparacion(db: Session, tipo: str, codigos: list[str],
                          seleccion: list[str] | None, anio: int | None) -> dict:
    entidad_tipo = "institucion" if tipo == "instituciones" else "programa"
    Modelo = Institucion if tipo == "instituciones" else Programa

    entidades = []
    for cod in codigos:
        ent = db.get(Modelo, cod)
        if ent:
            entidades.append({"codigo_snies": cod, "nombre": ent.nombre,
                              "enlace": f"/v1/{tipo}/{cod}"})

    stmt = select(Indicador).where(
        Indicador.entidad_tipo == entidad_tipo,
        Indicador.codigo_snies.in_(codigos),
    )
    if anio:
        stmt = stmt.where(Indicador.anio == anio)
    inds = db.scalars(stmt).all()

    claves = seleccion or sorted({i.clave for i in inds}) or list(ETIQUETAS.keys())
    filas, advertencias = [], []
    for clave in claves:
        etq, dom, unidad = ETIQUETAS.get(clave, (clave, "catalogo", ""))
        valores, anios = [], set()
        for cod in codigos:
            match = next((i for i in inds if i.codigo_snies == cod and i.clave == clave), None)
            valores.append({
                "codigo_snies": cod,
                "valor": match.valor if match else None,
                "anio": match.anio if match else None,
                "fuente": _fuente(clave),
            })
            if match and match.anio:
                anios.add(match.anio)
        if len(anios) > 1:
            advertencias.append(
                f"El indicador '{etq}' compara años distintos ({sorted(anios)}); interprétese con cuidado.")
        filas.append({"clave": clave, "etiqueta": etq, "dominio": dom, "unidad": unidad,
                      "mejor_direccion": MEJOR_DIRECCION.get(clave, "neutro"), "valores": valores})

    return {
        "tipo": tipo,
        "entidades": entidades,
        "indicadores": filas,
        "advertencias": advertencias,
        "meta": {
            "generado_en": datetime.utcnow().isoformat(),
            "nota_metodologica": (
                "comparaU no produce un ranking propio. Cada indicador proviene de su fuente "
                "oficial (ICFES, OLE, SPADIES, CNA, SNIES) y se presenta sin ponderación."),
        },
    }


def _fuente(clave: str) -> dict:
    if clave.startswith("saber_pro"):
        return {"sistema": "ICFES", "dataset_id": "u37r-hjmu"}
    if clave in ("empleabilidad_tasa_vinculacion", "ingreso_mediano_enganche"):
        return {"sistema": "OLE", "url": "https://ole.mineducacion.gov.co"}
    return {"sistema": "SPADIES", "url": "https://www.mineducacion.gov.co/sistemasinfo/spadies"}
