// Cliente de datos de comparaU.
// Consulta DIRECTAMENTE la API oficial de Datos Abiertos del Estado (datos.gov.co / Socrata),
// pública, con CORS y datos reales del SNIES e ICFES. No requiere backend propio.
//
// Datasets (Ministerio de Educación / ICFES):
//   Instituciones: n5yy-8nav · Programas: upr9-nkiz · Saber Pro: u37r-hjmu
// Licencia: CC BY-SA 4.0
import type { Institucion, Programa, InstitucionCollection } from "./types";

const SODA = "https://www.datos.gov.co/resource";
const INST = "n5yy-8nav";
const PROG = "upr9-nkiz";
const SABER = "u37r-hjmu";

const FUENTE_INST = { sistema: "SNIES", dataset: "MEN_INSTITUCIONES EDUCACIÓN SUPERIOR", dataset_id: INST, url: "https://www.datos.gov.co/d/n5yy-8nav", licencia: "CC BY-SA 4.0" };
const FUENTE_PROG = { sistema: "SNIES", dataset: "MEN_PROGRAMAS_DE_EDUCACIÓN_SUPERIOR", dataset_id: PROG, url: "https://www.datos.gov.co/d/upr9-nkiz", licencia: "CC BY-SA 4.0" };

function esc(v: string) { return v.replace(/'/g, "''"); }
function clean(v?: string) { return !v || /^(na|n\/a|no informa|no disponible|sin dato)$/i.test(v) ? undefined : v; }
function num(v?: string) { const n = Number(clean(v)); return isNaN(n) ? undefined : n; }
function titlecase(s: string) { return s.replace(/\w\S*/g, (t) => t[0].toUpperCase() + t.slice(1).toLowerCase()); }
function normUrl(w?: string) { const c = clean(w); if (!c || /^www\.$/i.test(c)) return undefined; return c.startsWith("http") ? c : "https://" + c.replace(/^\/+/, ""); }

async function soda(id: string, params: Record<string, string | number | undefined>) {
  const url = new URL(`${SODA}/${id}.json`);
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
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
    naturaleza_juridica: clean(r["naturaleza_jur_dica"]),
    estado: clean(r["estado"]),
    sitio_web: normUrl(r["p_gina_web"]),
    domicilio: { municipio: clean(r["municipio_domicilio"]), departamento: clean(r["departamento_domicilio"]) },
    acreditacion_institucional: {
      acreditada: (r["acreditada_alta_calidad"] ?? "").toUpperCase() === "SI",
      vigencia_anios: num(r["vigencia_de_la_acreditaci"]),
    },
    fuente: { ...FUENTE_INST, fecha_actualizacion: r["fecha_actualizacion"] },
  };
}

function mapProg(r: Record<string, string>): Programa {
  const titulo = titlecase(clean(r["nombretituloobtenido"]) ?? clean(r["nombrenbc"]) ?? "Programa");
  const cod = String(r["codigoinstitucion"] ?? "");
  const nbc = clean(r["nombrenbc"]);
  const nf = clean(r["nombrenivelformacion"]);
  const cr = num(r["cantidadcreditos"]);
  return {
    uid: `${cod}|${titulo}|${nbc}|${nf}|${cr}|${clean(r["nombremunicipioprograma"]) ?? ""}`,
    nombre: titulo,
    institucion: r["nombreinstitucion"] ?? "",
    codigo_institucion: cod,
    nivel_academico: (r["nombrenivelacademico"] as "Pregrado" | "Posgrado") ?? "Pregrado",
    nivel_formacion: nf,
    area: clean(r["nombreareaconocimiento"]),
    nbc,
    metodologia: clean(r["nombremetodologia"]),
    creditos: cr,
    periodos: num(r["cantidadperiodos"]),
    periodicidad: clean(r["nombreperiodicidad"]),
    municipio: clean(r["nombremunicipioprograma"]),
    acreditado: (clean(r["nombretipoacreditacion"]) ?? "").toLowerCase().includes("alta calidad"),
    tipo_acreditacion: clean(r["nombretipoacreditacion"]),
    anios_acreditados: num(r["aniosacreditados"]),
    fuente: FUENTE_PROG,
  };
}

function dedupe<T>(rows: T[], key: (r: T) => unknown): T[] {
  const seen = new Set<unknown>();
  return rows.filter((r) => {
    const k = key(r);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export const api = {
  async instituciones(p?: { q?: string; sector?: string; caracter_academico?: string; limit?: number }): Promise<InstitucionCollection> {
    const where = ["principal_seccional='Principal'"];
    if (p?.sector) where.push(`sector='${esc(p.sector)}'`);
    if (p?.caracter_academico) where.push(`car_cter_acad_mico='${esc(p.caracter_academico)}'`);
    if (p?.q) where.push(`upper(nombre_instituci_n) like upper('%${esc(p.q)}%')`);
    const rows: Record<string, string>[] = await soda(INST, { $where: where.join(" AND "), $order: "nombre_instituci_n", $limit: p?.limit ?? 48 });
    const data = dedupe(rows.map(mapInst), (r) => r.codigo_snies);
    return { data, meta: { paginacion: { total: data.length, limit: p?.limit ?? 48 } } };
  },

  async institucion(codigo: string): Promise<Institucion> {
    const rows: Record<string, string>[] = await soda(INST, { $where: `c_digo_instituci_n=${Number(codigo)}`, $limit: 5 });
    if (!rows.length) throw new Error("no encontrada");
    return mapInst(rows.find((r) => r["principal_seccional"] === "Principal") ?? rows[0]);
  },

  // Búsqueda de programas por título otorgado o núcleo de conocimiento (NBC). Devuelve objetos completos.
  async programas(p?: { q?: string; codigo_institucion?: string; nivel?: string; limit?: number }): Promise<Programa[]> {
    const where = ["nombreestadoprograma='Activo'"];
    if (p?.codigo_institucion) where.push(`codigoinstitucion=${Number(p.codigo_institucion)}`);
    if (p?.nivel) where.push(`nombrenivelacademico='${esc(p.nivel)}'`);
    if (p?.q) where.push(`(upper(nombretituloobtenido) like upper('%${esc(p.q)}%') OR upper(nombrenbc) like upper('%${esc(p.q)}%'))`);
    const rows: Record<string, string>[] = await soda(PROG, { $where: where.join(" AND "), $order: "nombretituloobtenido", $limit: p?.limit ?? 40 });
    return dedupe(rows.map(mapProg), (r) => r.uid);
  },

  async conteoProgramas(codigoInstitucion: string): Promise<number> {
    const rows: { count: string }[] = await soda(PROG, { $select: "count(1) as count", $where: `codigoinstitucion=${Number(codigoInstitucion)} AND nombreestadoprograma='Activo'` });
    return rows.length ? Number(rows[0].count) : 0;
  },

  // Promedio global Saber Pro (ICFES) por institución, agregado en el servidor de datos.gov.co.
  async saberPro(codigoInstitucion: string): Promise<{ global: number; n: number } | null> {
    const sel = [
      "avg(mod_razona_cuantitat_punt::number) as cuant", "avg(mod_lectura_critica_punt::number) as lect",
      "avg(mod_competen_ciudada_punt::number) as ciud", "avg(mod_comuni_escrita_punt::number) as escr",
      "avg(mod_ingles_punt::number) as ing", "count(*) as n",
    ].join(",");
    const rows: Record<string, string>[] = await soda(SABER, { $select: sel, $where: `inst_cod_institucion='${Number(codigoInstitucion)}'` });
    if (!rows.length || !Number(rows[0].n)) return null;
    const r = rows[0];
    const mods = [r.cuant, r.lect, r.ciud, r.escr, r.ing].map(Number).filter((x) => !isNaN(x) && x > 0);
    if (!mods.length) return null;
    return { global: Math.round(mods.reduce((a, b) => a + b, 0) / mods.length), n: Number(r.n) };
  },
};
