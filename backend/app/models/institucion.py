"""Modelo ORM de Institución (IES). Campos anclados al dataset SNIES n5yy-8nav."""
from sqlalchemy import String, Boolean, Integer, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class Institucion(Base):
    __tablename__ = "instituciones"

    codigo_snies: Mapped[str] = mapped_column(String(10), primary_key=True)
    nombre: Mapped[str] = mapped_column(String(255), index=True)
    sigla: Mapped[str | None] = mapped_column(String(50))
    nit: Mapped[str | None] = mapped_column(String(30))
    sector: Mapped[str] = mapped_column(String(20), index=True)            # Oficial | Privado
    caracter_academico: Mapped[str] = mapped_column(String(80), index=True)
    naturaleza_juridica: Mapped[str | None] = mapped_column(String(40))
    principal_seccional: Mapped[str | None] = mapped_column(String(20))
    estado: Mapped[str | None] = mapped_column(String(60))
    sitio_web: Mapped[str | None] = mapped_column(String(255))
    telefono: Mapped[str | None] = mapped_column(String(60))
    # Domicilio (DIVIPOLA)
    direccion: Mapped[str | None] = mapped_column(String(255))
    municipio: Mapped[str | None] = mapped_column(String(120))
    cod_municipio: Mapped[str | None] = mapped_column(String(5), index=True)
    departamento: Mapped[str | None] = mapped_column(String(120), index=True)
    cod_departamento: Mapped[str | None] = mapped_column(String(2), index=True)
    # Acreditación institucional
    acreditada: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    acreditacion_resolucion: Mapped[str | None] = mapped_column(String(40))
    acreditacion_fecha: Mapped[Date | None] = mapped_column(Date)
    acreditacion_vigencia_anios: Mapped[int | None] = mapped_column(Integer)
    # Trazabilidad
    fuente_id: Mapped[int | None] = mapped_column(ForeignKey("fuentes.id"))
    fecha_actualizacion: Mapped[Date | None] = mapped_column(Date)

    programas: Mapped[list["Programa"]] = relationship(back_populates="institucion")  # noqa: F821
