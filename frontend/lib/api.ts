// Cliente de datos de comparaU.
// Consulta DIRECTAMENTE la API oficial de Datos Abiertos del Estado colombiano
// (datos.gov.co / Socrata), que es pública, con CORS y datos reales del SNIES.
// No requiere backend propio: funciona desde el navegador en Vercel.
//
// Datasets oficiales (Ministerio de Educación Nacional):
//   - Instituciones: n5yy-8nav
//   - Programas:     upr9-nkiz
// Licencia: CC BY-SA 4.0
import type { Institucion, Programa, InstitucionCollection, ProgramaCollection } from "./types";

const SODA = "https://www.datos.gov.co/resource";
const INST = "n5yy-8nav";
const PROG = "upr9-nkiz";

const FUENTE_INST = {
  sistema: "SNIES",
  dataset: "MEN_INSTITUCIONES EDUCACIÓN SUPERIOR",
  dataset_id: INST,
  url: "https://www.datos.gov.co/d/n5yy-8nav",
  licencia: "CC BY-SA 4.0",
};
const FUENTE_PROG = {
  sistema: "SNIES",
  dataset: "MEN_PROGRAMAS_DE_EDUCACIÓN_SUPERIOR",
  dataset_id: PROG,
  url: "https://www.datos.gov.co/d/upr9-nkiz",
  licencia: "CC BY-SA 4.0",
};

function esc(v: string) {
  return v.replace(/'/g, "''");
}
function normUrl(w?: string) {
  if (!w || /no disponible|^www\.$|^na$/i.test(w)) return undefined;
  return w.startsWith("http") ? w : "https://" + w.replace(/^\/+/, "");
}

async function soda(id: string, params: Record<string, string | number | undefined>) {
  const url = new URL(`${SODA}/${id}.json`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`datos.gov.co ${res.status}`);
  return res.json();
}

function mapInst(r: Record<string, string>): Institucion {
  return {
    codigo_snies: String(r["c_digo_instituci_n"] ?? ""),
    nombre: r["nombre_instituci_n"] ?? "",
    sector: (r["sector"] as "Oficial" | "Privado") ?? "Privado",
    caracter_academico: r["car_cter_acad_mico"] ?? "",
    naturaleza_juridica: r["naturaleza_jur_dica"],
    estado: r["estado"],
    sitio_web: normUrl(r["p_gina_web"]),
    domicilio: {
      municipio: r["municipio_domicilio"],
      departamento: r["departamento_domicilio"],
    },
    acreditacion_institucional: {
      acreditada: (r["acreditada_alta_calidad"] ?? "").toUpperCase() === "SI",
      vigencia_anios: r["vigencia_de_la_acreditaci"] && r["vigencia_de_la_acreditaci"] !== "NA"
        ? Number(r["vigencia_de_la_acreditaci"]) : undefined,
    },
    fuente: { ...FUENTE_INST, fecha_actualizacion: r["fecha_actualizacion"] },
  };
}

function mapProg(r: Record<string, string>): Programa {
  return {
    codigo_snies: String(r["codigoprograma"] ?? ""),
    nombre: r["nombreprograma"] ?? "",
    codigo_institucion: String(r["codigoinstitucion"] ?? ""),
    nivel_academico: (r["nombrenivelacademico"] as "Pregrado" | "Posgrado") ?? "Pregrado",
    nivel_formacion: r["nombrenivelformacion"],
    nbc: r["nombrenbc"],
    metodologia: r["nombremetodologia"],
    creditos: r["cantidadcreditos"] ? Number(r["cantidadcreditos"]) : undefined,
    acreditado: (r["nombretipoacreditacion"] ?? "").toLowerCase().includes("alta calidad"),
    fuente: FUENTE_PROG,
  };
}

function dedupe<T extends { codigo_snies: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  return rows.filter((r) => (seen.has(r.codigo_snies) ? false : seen.add(r.codigo_snies)));
}

export const api = {
  async instituciones(p?: {
    q?: string; sector?: string; caracter_academico?: string; limit?: number;
  }): Promise<InstitucionCollection> {
    const where: string[] = ["principal_seccional='Principal'"];
    if (p?.sector) where.push(`sector='${esc(p.sector)}'`);
    if (p?.caracter_academico) where.push(`car_cter_acad_mico='${esc(p.caracter_academico)}'`);
    if (p?.q) where.push(`upper(nombre_instituci_n) like upper('%${esc(p.q)}%')`);
    const rows: Record<string, string>[] = await soda(INST, {
      $where: where.join(" AND "),
      $order: "nombre_instituci_n",
      $limit: p?.limit ?? 48,
    });
    const data = dedupe(rows.map(mapInst));
    return { data, meta: { paginacion: { total: data.length, limit: p?.limit ?? 48 } } };
  },

  async institucion(codigo: string): Promise<Institucion> {
    const rows: Record<string, string>[] = await soda(INST, {
      $where: `c_digo_instituci_n=${Number(codigo)}`,
      $limit: 5,
    });
    if (!rows.length) throw new Error("no encontrada");
    const principal = rows.find((r) => r["principal_seccional"] === "Principal") ?? rows[0];
    return mapInst(principal);
  },

  async programas(p?: {
    q?: string; codigo_institucion?: string; nivel_academico?: string; limit?: number;
  }): Promise<ProgramaCollection> {
    const where: string[] = ["nombreestadoprograma='Activo'"];
    if (p?.codigo_institucion) where.push(`codigoinstitucion=${Number(p.codigo_institucion)}`);
    if (p?.nivel_academico) where.push(`nombrenivelacademico='${esc(p.nivel_academico)}'`);
    if (p?.q) where.push(`upper(nombreprograma) like upper('%${esc(p.q)}%')`);
    const rows: Record<string, string>[] = await soda(PROG, {
      $where: where.join(" AND "),
      $order: "nombreprograma",
      $limit: p?.limit ?? 48,
    });
    const data = rows.map(mapProg);
    return { data, meta: { paginacion: { total: data.length, limit: p?.limit ?? 48 } } };
  },

  // Conteo de programas de una institución (dato real, agregado en el servidor de datos.gov.co)
  async conteoProgramas(codigoInstitucion: string): Promise<number> {
    const rows: { count: string }[] = await soda(PROG, {
      $select: "count(1) as count",
      $where: `codigoinstitucion=${Number(codigoInstitucion)} AND nombreestadoprograma='Activo'`,
    });
    return rows.length ? Number(rows[0].count) : 0;
  },
};
