// Tipos del dominio. En producción se generan del OpenAPI (openapi-typescript);
// estos son los esenciales escritos a mano para arrancar.
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

export interface Programa {
  codigo_snies: string;
  nombre: string;
  codigo_institucion: string;
  nivel_academico: "Pregrado" | "Posgrado";
  nivel_formacion?: string;
  nbc?: string;
  metodologia?: string;
  creditos?: number;
  acreditado: boolean;
  fuente: Fuente;
}

export interface Paginacion { total: number; limit: number; siguiente?: string }
export interface InstitucionCollection { data: Institucion[]; meta: { paginacion: Paginacion } }
export interface ProgramaCollection { data: Programa[]; meta: { paginacion: Paginacion } }

export interface IndicadorValor { codigo_snies: string; valor: number | string | null; anio?: number; fuente: Fuente }
export interface IndicadorFila {
  clave: string; etiqueta: string; dominio: string; unidad: string;
  mejor_direccion: "mayor_mejor" | "menor_mejor" | "neutro"; valores: IndicadorValor[];
}
export interface Comparacion {
  tipo: string;
  entidades: { codigo_snies: string; nombre: string }[];
  indicadores: IndicadorFila[];
  advertencias: string[];
  meta: { nota_metodologica: string };
}
