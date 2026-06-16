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
// Pliega tildes y mayúsculas en el cliente: "Ingeniería" -> "ingenieria".
function fold(s?: string) { return (s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim(); }
// Convierte cada vocal/n/ñ del término en comodín '_' de SoQL. Así "ingenieria" iguala
// "Ingeniería" aunque el catálogo guarde la tilde y 'like' distinga í de i. Escapa comillas.
function aiPattern(t: string) { return t.replace(/'/g, "''").replace(/[aeiouáéíóúüAEIOUÁÉÍÓÚÜnñNÑ]/g, "_"); }

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

// ————————————————— Buscador inteligente de programas —————————————————
// Palabras vacías que no aportan a la búsqueda.
const STOP = new Set(["de", "del", "la", "el", "los", "las", "y", "e", "o", "u", "en", "con", "para", "por", "a", "al", "un", "una", "the", "of"]);

// Sinónimos / nombres comunes -> términos tal como aparecen en el catálogo oficial.
const SINONIMOS: Record<string, string[]> = {
  sistemas: ["sistemas", "computacion", "informatica", "software"],
  software: ["software", "sistemas", "informatica"],
  computacion: ["computacion", "sistemas", "informatica"],
  informatica: ["informatica", "sistemas", "computacion"],
  sicologia: ["psicologia"], sicologo: ["psicologo"],
  mercadeo: ["mercadeo", "marketing", "mercadotecnia"], marketing: ["marketing", "mercadeo"],
  finanzas: ["finanzas", "financiero", "financiera"],
  medicina: ["medicina", "medico"], veterinaria: ["veterinaria", "veterinario"],
  leyes: ["derecho", "abogado", "juridico"], gastronomia: ["gastronomia", "culinario", "cocina"],
};
function expandirSinonimos(t: string): string[] { return [...new Set(SINONIMOS[t] ?? [t])]; }

// Distancia de edición (Levenshtein) acotada — tolera errores de tipeo. Corta apenas supera el máximo.
function lev(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]; let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      cur.push(v); if (v < best) best = v;
    }
    if (best > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}
function prefijoComun(a: string, b: string): number { let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++; return i; }

// Cuánto "pega" un término contra las palabras de un campo: exacto > prefijo > raíz común > subcadena > difuso.
function coincidencia(tok: string, words: string[]): number {
  let best = 0;
  for (const w of words) {
    let s = 0;
    if (w === tok) s = 1;
    else if (w.length >= 3 && (w.startsWith(tok) || tok.startsWith(w))) s = 0.85;
    else {
      const cp = prefijoComun(tok, w);
      if (cp >= 5 && cp >= 0.6 * Math.min(tok.length, w.length)) s = 0.72; // raíz común ("administrativa"~"administrador")
      else if (tok.length >= 4 && w.includes(tok)) s = 0.7;
      else { const mx = tok.length <= 4 ? 0 : tok.length <= 7 ? 1 : 2; if (mx > 0 && lev(tok, w, mx) <= mx) s = 0.5; } // typo
    }
    if (s > best) best = s;
  }
  return best;
}

// Vocabulario de "carrera" (palabras de los NBC + áreas) para distinguir carrera de universidad.
// Se descarga una sola vez y se cachea.
let vocabPromise: Promise<Set<string>> | null = null;
function getVocab(): Promise<Set<string>> {
  if (!vocabPromise) {
    vocabPromise = (async () => {
      const v = new Set<string>(["empresas", "negocios", "internacional", "internacionales", "publica", "publico", "software", "datos", "exterior", "social", "clinica", "deportiva", "financiera"]);
      try {
        const [nbc, area] = await Promise.all([
          soda(PROG, { $select: "nombrenbc", $group: "nombrenbc", $limit: 300 }) as Promise<Record<string, string>[]>,
          soda(PROG, { $select: "nombreareaconocimiento", $group: "nombreareaconocimiento", $limit: 80 }) as Promise<Record<string, string>[]>,
        ]);
        for (const r of nbc) for (const w of fold(r["nombrenbc"]).split(/\s+/)) if (w.length >= 4 && w !== "afines") v.add(w);
        for (const r of area) for (const w of fold(r["nombreareaconocimiento"]).split(/\s+/)) if (w.length >= 4 && w !== "afines") v.add(w);
      } catch { /* si falla, todo se tratará como carrera (degradación segura) */ }
      return v;
    })();
  }
  return vocabPromise;
}

// Resuelve los tokens de "universidad" a códigos de institución (con filtro fino en el cliente
// para descartar coincidencias accidentales del comodín, p.ej. "eafit" -> "FITEC").
async function resolverInstituciones(toks: string[]): Promise<string[]> {
  const conds = toks.map((t) => `upper(nombre_instituci_n) like upper('%${aiPattern(t)}%')`).join(" AND ");
  const rows: Record<string, string>[] = await soda(INST, { $select: "c_digo_instituci_n,nombre_instituci_n", $where: conds, $limit: 60 });
  const keep = rows.filter((r) => {
    const fn = fold(r["nombre_instituci_n"]);
    return toks.every((t) => fn.includes(t) || fn.split(/\s+/).some((w) => w.length > 3 && lev(t, w, t.length <= 5 ? 1 : 2) <= (t.length <= 5 ? 1 : 2)));
  });
  return [...new Set(keep.map((r) => String(r["c_digo_instituci_n"])))];
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

  // Buscador inteligente de programas. Entiende: tildes y mayúsculas, varias palabras en
  // cualquier orden, "universidad + carrera" juntas ("psicología javeriana"), errores de
  // tipeo ("psiclogia") y sinónimos/nombres comunes ("medicina"→Médico, "sistemas"→Ing. de Sistemas).
  // Ordena por relevancia, dando prioridad a pregrado (el público típico son estudiantes y familias).
  async programas(p?: { q?: string; codigo_institucion?: string; nivel?: string; limit?: number }): Promise<Programa[]> {
    const limit = p?.limit ?? 40;
    const q = p?.q?.trim();

    // Sin texto: simplemente listar (p.ej. los programas de una institución).
    if (!q) {
      const where = ["nombreestadoprograma='Activo'"];
      if (p?.codigo_institucion) where.push(`codigoinstitucion=${Number(p.codigo_institucion)}`);
      if (p?.nivel) where.push(`nombrenivelacademico='${esc(p.nivel)}'`);
      const rows: Record<string, string>[] = await soda(PROG, { $where: where.join(" AND "), $order: "nombretituloobtenido", $limit: limit });
      return dedupe(rows.map(mapProg), (r) => r.uid);
    }

    // 1) Tokenizar y clasificar cada palabra en "carrera" o "universidad".
    const tokens = fold(q).split(/\s+/).filter((t) => t.length >= 2 && !STOP.has(t));
    if (!tokens.length) return [];
    const vocab = await getVocab();
    let carrera: string[] = [], universidad: string[] = [];
    for (const t of tokens) (!vocab.size || vocab.has(t) || t.length < 4 ? carrera : universidad).push(t);

    // 2) Resolver "universidad" a códigos. Si no resuelve (o es ambiguo), esos tokens vuelven a carrera.
    let codes: string[] = [];
    if (universidad.length) {
      try { codes = await resolverInstituciones(universidad); } catch { codes = []; }
      if (!codes.length || codes.length > 15) { carrera = carrera.concat(universidad); universidad = []; codes = []; }
    }
    const grupos = carrera.map(expandirSinonimos);
    if (!grupos.length && !codes.length) return [];

    // 3) Consulta: filtro por institución (si aplica) + cada término de carrera en título o NBC
    //    (insensible a tildes vía comodines). OR entre sinónimos, AND entre términos.
    const baseWhere = (extra: string[]) => {
      const w = ["nombreestadoprograma='Activo'"];
      if (p?.codigo_institucion) w.push(`codigoinstitucion=${Number(p.codigo_institucion)}`);
      if (p?.nivel) w.push(`nombrenivelacademico='${esc(p.nivel)}'`);
      if (codes.length) w.push(`codigoinstitucion in(${codes.join(",")})`);
      return w.concat(extra);
    };
    const groupClause = (g: string[]) => {
      const ors: string[] = [];
      for (const x of g) { const pat = `'%${aiPattern(x)}%'`; ors.push(`upper(nombretituloobtenido) like upper(${pat})`, `upper(nombrenbc) like upper(${pat})`); }
      return `(${ors.join(" OR ")})`;
    };
    let rows: Record<string, string>[] = await soda(PROG, { $where: baseWhere(grupos.map(groupClause)).join(" AND "), $order: "nombretituloobtenido", $limit: 250 });

    // 3b) Red de seguridad para typos: si hubo pocas filas, anclar en las primeras letras
    //     (normalmente sin error) del término más largo y dejar que el filtro difuso decida.
    if (grupos.length && rows.length < 6) {
      const lg = carrera.slice().sort((a, b) => b.length - a.length)[0];
      const pat = `'%${aiPattern(lg.slice(0, Math.min(4, lg.length)))}%'`;
      const more: Record<string, string>[] = await soda(PROG, { $where: baseWhere([`(upper(nombretituloobtenido) like upper(${pat}) OR upper(nombrenbc) like upper(${pat}))`]).join(" AND "), $order: "nombretituloobtenido", $limit: 250 });
      rows = rows.concat(more);
    }
    const progs = dedupe(rows.map(mapProg), (r) => r.uid);

    // 4) Filtrar (todos los términos de carrera deben coincidir) y ordenar por relevancia.
    const score = (pr: Programa): number => {
      const tw = fold(pr.nombre).split(/\s+/), nw = fold(pr.nbc ?? "").split(/\s+/);
      let total = 0;
      for (const g of grupos) {
        let best = 0;
        for (const x of g) { const s = Math.max(coincidencia(x, tw) * 30, coincidencia(x, nw) * 16); if (s > best) best = s; }
        if (best === 0) return -1; // término ausente -> descartar
        total += best;
      }
      if (pr.nivel_academico === "Pregrado") total += 40;
      total -= Math.min(fold(pr.nombre).length, 60) / 40;
      return total;
    };
    return progs
      .map((pr) => ({ pr, s: score(pr) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, limit)
      .map((x) => x.pr);
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
