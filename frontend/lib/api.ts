// Cliente de la API comparaU (VPS). Tipos generables con `npm run gen:types`.
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api.comparau.com/v1";

async function get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
  const url = new URL(API_BASE + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 }, // ISR: revalida cada hora
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${url.pathname}`);
  return res.json() as Promise<T>;
}

export const api = {
  instituciones: (p?: Record<string, string | number | boolean | undefined>) =>
    get<import("./types").InstitucionCollection>("/instituciones", p),
  institucion: (codigo: string) =>
    get<import("./types").Institucion>(`/instituciones/${codigo}`),
  programas: (p?: Record<string, string | number | boolean | undefined>) =>
    get<import("./types").ProgramaCollection>("/programas", p),
  comparar: (tipo: "instituciones" | "programas", ids: string[]) =>
    get<import("./types").Comparacion>("/comparar", { tipo, ids: ids.join(",") }),
};
