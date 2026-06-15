"""Modelos ORM de Programa e Indicador. Anclados a upr9-nkiz y fuentes de resultado."""
from sqlalchemy import String, Integer, Date, Float, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Programa(Base):
    __tablename__ = "programas"

    codigo_snies: Mapped[str] = mapped_column(String(15), primary_key=True)
    nombre: Mapped[str] = mapped_column(String(255), index=True)
    codigo_institucion: Mapped[str] = mapped_column(ForeignKey("instituciones.codigo_snies"), index=True)
    titulo_otorgado: Mapped[str | None] = mapped_column(String(255))
    nivel_academico: Mapped[str] = mapped_column(String(20), index=True)   # Pregrado | Posgrado
    nivel_formacion: Mapped[str | None] = mapped_column(String(60), index=True)
    cod_area: Mapped[str | None] = mapped_column(String(10), index=True)
    area_conocimiento: Mapped[str | None] = mapped_column(String(120))
    cod_nbc: Mapped[str | None] = mapped_column(String(10), index=True)
    nbc: Mapped[str | None] = mapped_column(String(120))
    metodologia: Mapped[str | None] = mapped_column(String(40), index=True)
    creditos: Mapped[int | None] = mapped_column(Integer)
    periodicidad: Mapped[str | None] = mapped_column(String(40))
    numero_periodos: Mapped[int | None] = mapped_column(Integer)
    cod_municipio: Mapped[str | None] = mapped_column(String(5))
    municipio_oferta: Mapped[str | None] = mapped_column(String(120))
    estado: Mapped[str | None] = mapped_column(String(20), index=True)
    fecha_creacion: Mapped[Date | None] = mapped_column(Date)
    # Reconocimiento
    tipo_acreditacion: Mapped[str | None] = mapped_column(String(40))
    acreditado: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    resolucion_acreditacion: Mapped[str | None] = mapped_column(String(40))
    anios_acreditados: Mapped[int | None] = mapped_column(Integer)
    descripcion: Mapped[str | None] = mapped_column(String)  # null: no publicado por la fuente
    fuente_id: Mapped[int | None] = mapped_column(ForeignKey("fuentes.id"))

    institucion: Mapped["Institucion"] = relationship(back_populates="programas")  # noqa: F821


class Indicador(Base):
    """Indicador oficial atómico (Saber Pro / OLE / SPADIES). Ver DISENO_API.md §11.10."""
    __tablename__ = "indicadores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    entidad_tipo: Mapped[str] = mapped_column(String(20), index=True)   # institucion | programa
    codigo_snies: Mapped[str] = mapped_column(String(15), index=True)
    clave: Mapped[str] = mapped_column(String(60), index=True)
    dominio: Mapped[str] = mapped_column(String(20), index=True)        # calidad | empleabilidad | permanencia
    etiqueta: Mapped[str | None] = mapped_column(String(160))
    valor: Mapped[float | None] = mapped_column(Float)
    unidad: Mapped[str | None] = mapped_column(String(20))
    anio: Mapped[int] = mapped_column(Integer, index=True)
    grano: Mapped[str | None] = mapped_column(String(20))
    fuente_id: Mapped[int | None] = mapped_column(ForeignKey("fuentes.id"))


class Fuente(Base):
    __tablename__ = "fuentes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sistema: Mapped[str] = mapped_column(String(40))
    dataset: Mapped[str | None] = mapped_column(String(120))
    dataset_id: Mapped[str | None] = mapped_column(String(40))
    url: Mapped[str | None] = mapped_column(String(255))
    licencia: Mapped[str | None] = mapped_column(String(40), default="CC BY-SA 4.0")
    fecha_actualizacion: Mapped[Date | None] = mapped_column(Date)
