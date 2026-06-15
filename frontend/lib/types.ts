// Tipos del dominio comparaU (datos oficiales SNIES / ICFES, datos.gov.co).
export interface Fuente {
  sistema: string;
  dataset?: string;
  dataset_id?: string;
  url?: string;
  licencia?: string;
  fecha_actualizacion?: string;
}

export interface Institucion {
  codigo_snies: string;
  nombre: string;
  sigla?: string;
  sector: "Oficial" | "Privado";
  caracter_academico: string;
  naturaleza_juridica?: string;
  estado?: string;
  sitio_web?: string;
  domicilio: { municipio?: string; departamento?: string };
  acreditacion_institucional: { acreditada: boolean; vigencia_anios?: number };
  fuente: Fuente;
}

// Nota: el dataset de programas (upr9-nkiz) trae corruptas las columnas
// nombreprograma/codigoprograma (contienen el departamento). Por eso el
// "nombre" del programa se toma del título otorgado y se identifica con un uid sintético.
export interface Programa {
  uid: string;
  nombre: string; // = título otorgado (ej. "PSICÓLOGO")
  institucion: string;
  codigo_institucion: string;
  nivel_academico: "Pregrado" | "Posgrado";
  nivel_formacion?: string;
  area?: string;
  nbc?: string;
  metodologia?: string;
  creditos?: number;
  periodos?: number;
  periodicidad?: string;
  municipio?: string;
  acreditado: boolean;
  tipo_acreditacion?: string;
  anios_acreditados?: number;
  fuente: Fuente;
}

export interface Paginacion { total: number; limit: number; siguiente?: string }
export interface InstitucionCollection { data: Institucion[]; meta: { paginacion: Paginacion } }
export interface ProgramaCollection { data: Programa[]; meta: { paginacion: Paginacion } }
