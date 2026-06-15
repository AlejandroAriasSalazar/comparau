"""Registro de fuentes oficiales y su mapeo de columnas → modelo.

Todas las fuentes son oficiales y verificables (datos.gov.co / MEN / ICFES).
Licencia de origen: CC BY-SA 4.0.
"""

SODA = "https://www.datos.gov.co/resource/{id}.json"

SOURCES = {
    "instituciones": {
        "sistema": "SNIES",
        "dataset": "MEN_INSTITUCIONES EDUCACIÓN SUPERIOR",
        "dataset_id": "n5yy-8nav",
        "url": SODA.format(id="n5yy-8nav"),
        "map": {
            "codigo_snies": "c_digo_instituci_n",
            "nombre": "nombre_instituci_n",
            "nit": "n_mero_identificaci_n",
            "principal_seccional": "principal_seccional",
            "naturaleza_juridica": "naturaleza_jur_dica",
            "sector": "sector",
            "caracter_academico": "car_cter_acad_mico",
            "cod_departamento": "cod_departamento",
            "departamento": "departamento_domicilio",
            "municipio": "municipio_domicilio",
            "direccion": "direcci_n_domicilio",
            "telefono": "tel_fono_domicilio",
            "acreditada": "acreditada_alta_calidad",
            "acreditacion_fecha": "fecha_acreditaci_n",
            "acreditacion_resolucion": "resoluci_n_de_la_acreditaci",
            "acreditacion_vigencia_anios": "vigencia_de_la_acreditaci",
            "estado": "estado",
            "sitio_web": "p_gina_web",
            "fecha_actualizacion": "fecha_actualizacion",
        },
    },
    "programas": {
        "sistema": "SNIES",
        "dataset": "MEN_PROGRAMAS_DE_EDUCACIÓN_SUPERIOR",
        "dataset_id": "upr9-nkiz",
        "url": SODA.format(id="upr9-nkiz"),
        "map": {
            "codigo_snies": "codigoprograma",
            "nombre": "nombreprograma",
            "codigo_institucion": "codigoinstitucion",
            "titulo_otorgado": "nombretituloobtenido",
            "nivel_academico": "nombrenivelacademico",
            "nivel_formacion": "nombrenivelformacion",
            "cod_area": "codigoareaconocimiento",
            "area_conocimiento": "nombreareaconocimiento",
            "cod_nbc": "codigonbc",
            "nbc": "nombrenbc",
            "metodologia": "nombremetodologia",
            "creditos": "cantidadcreditos",
            "periodicidad": "nombreperiodicidad",
            "numero_periodos": "cantidadperiodos",
            "cod_municipio": "codigomunicipioprograma",
            "municipio_oferta": "nombremunicipioprograma",
            "estado": "nombreestadoprograma",
            "fecha_creacion": "fechacreacion",
            "tipo_acreditacion": "nombretipoacreditacion",
            "resolucion_acreditacion": "numeroresolucionacreditacion",
            "anios_acreditados": "aniosacreditados",
        },
    },
    "saber_pro": {
        "sistema": "ICFES",
        "dataset": "Resultados únicos Saber Pro",
        "dataset_id": "u37r-hjmu",
        "url": SODA.format(id="u37r-hjmu"),
        "agregacion": "promedio_por_institucion_y_programa",  # microdatos → agregados
    },
    # OLE y SPADIES: descarga de bases consolidadas (no SODA). Ver ingest.py.
}

# Centinelas que deben convertirse a NULL.
SENTINELS = {"NA", "NO INFORMA", "No Informa", "No disponible", "no disponible", "", "SIN DATO"}
