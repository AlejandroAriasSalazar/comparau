"use client";
import { useState } from "react";
import { Plus, X, Scale, ShieldCheck, BadgeCheck } from "lucide-react";
import { api } from "@/lib/api";
import type { Institucion } from "@/lib/types";

type Comparada = Institucion & { totalProgramas?: number };

const FILAS: { etiqueta: string; valor: (i: Comparada) => string; mejor?: "alto" }[] = [
  { etiqueta: "Sector", valor: (i) => i.sector },
  { etiqueta: "Carácter académico", valor: (i) => i.caracter_academico },
  { etiqueta: "Naturaleza jurídica", valor: (i) => i.naturaleza_juridica ?? "—" },
  {
    etiqueta: "Acreditación alta calidad",
    valor: (i) =>
      i.acreditacion_institucional?.acreditada
        ? `Sí${i.acreditacion_institucional.vigencia_anios ? ` · ${i.acreditacion_institucional.vigencia_anios} años` : ""}`
        : "No",
  },
  { etiqueta: "Ciudad", valor: (i) => i.domicilio?.municipio ?? "—" },
  { etiqueta: "Departamento", valor: (i) => i.domicilio?.departamento ?? "—" },
  { etiqueta: "Programas activos", valor: (i) => (i.totalProgramas != null ? String(i.totalProgramas) : "—"), mejor: "alto" },
];

export default function CompararPage() {
  const [seleccion, setSeleccion] = useState<Institucion[]>([]);
  const [q, setQ] = useState("");
  const [sugerencias, setSugerencias] = useState<Institucion[]>([]);
  const [resultado, setResultado] = useState<Comparada[] | null>(null);
  const [cargando, setCargando] = useState(false);

  async function buscar(texto: string) {
    setQ(texto);
    if (texto.length < 2) return setSugerencias([]);
    try {
      const r = await api.instituciones({ q: texto, limit: 6 });
      setSugerencias(r.data);
    } catch { setSugerencias([]); }
  }

  function agregar(i: Institucion) {
    if (seleccion.length >= 5 || seleccion.find((s) => s.codigo_snies === i.codigo_snies)) return;
    setSeleccion([...seleccion, i]);
    setQ(""); setSugerencias([]);
  }

  async function comparar() {
    if (seleccion.length < 2) return;
    setCargando(true);
    try {
      const enriquecidas = await Promise.all(
        seleccion.map(async (s) => {
          let totalProgramas: number | undefined;
          try { totalProgramas = await api.conteoProgramas(s.codigo_snies); } catch { /* opcional */ }
          return { ...s, totalProgramas };
        })
      );
      setResultado(enriquecidas);
    } finally { setCargando(false); }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center gap-2">
        <Scale className="text-brand-600" size={26} />
        <h1 className="text-3xl font-bold tracking-tight text-ink">Comparar universidades</h1>
      </div>
      <p className="mt-2 text-ink-soft">
        Elige de 2 a 5 instituciones. Los datos vienen en vivo del SNIES (datos abiertos del Ministerio de Educación).
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {seleccion.map((s) => (
          <span key={s.codigo_snies} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800">
            {s.nombre.length > 34 ? s.nombre.slice(0, 34) + "…" : s.nombre}
            <button onClick={() => setSeleccion(seleccion.filter((x) => x.codigo_snies !== s.codigo_snies))}>
              <X size={14} />
            </button>
          </span>
        ))}
        {seleccion.length < 5 && (
          <div className="relative">
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-surface-border bg-white px-3 py-2">
              <Plus size={16} className="text-ink-faint" />
              <input value={q} onChange={(e) => buscar(e.target.value)}
                placeholder="Añadir universidad…"
                className="w-52 bg-transparent text-sm outline-none placeholder:text-ink-faint" />
            </div>
            {sugerencias.length > 0 && (
              <ul className="card absolute z-20 mt-1 w-72 overflow-hidden p-1">
                {sugerencias.map((i) => (
                  <li key={i.codigo_snies}>
                    <button onClick={() => agregar(i)}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-soft">
                      {i.nombre}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <button onClick={comparar} disabled={seleccion.length < 2 || cargando}
        className="btn-primary mt-6 disabled:opacity-40">
        {cargando ? "Comparando…" : "Comparar"}
      </button>

      {resultado && (
        <div className="mt-10">
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-surface-soft">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium text-ink-soft">Atributo</th>
                  {resultado.map((e) => (
                    <th key={e.codigo_snies} className="px-4 py-3 font-semibold text-ink">{e.nombre}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {FILAS.map((fila) => {
                  const valores = resultado.map((e) => fila.valor(e));
                  const max = fila.mejor === "alto"
                    ? Math.max(...resultado.map((e) => e.totalProgramas ?? -1)) : null;
                  return (
                    <tr key={fila.etiqueta}>
                      <td className="px-5 py-3 text-ink-soft">{fila.etiqueta}</td>
                      {resultado.map((e, idx) => {
                        const destaca = fila.mejor === "alto" && max != null && (e.totalProgramas ?? -1) === max && max >= 0;
                        return (
                          <td key={e.codigo_snies} className={`px-4 py-3 font-semibold ${destaca ? "text-accent-green" : "text-ink"}`}>
                            {fila.etiqueta === "Acreditación alta calidad" && valores[idx].startsWith("Sí") ? (
                              <span className="inline-flex items-center gap-1"><BadgeCheck size={14} className="text-accent-green" /> {valores[idx]}</span>
                            ) : valores[idx]}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-ink-faint">
            <ShieldCheck size={14} /> Datos oficiales en vivo del SNIES (datos.gov.co, MEN · CC BY-SA 4.0).
            Los indicadores de calidad, empleabilidad y permanencia (Saber Pro / OLE / SPADIES) se añadirán con el backend.
          </p>
        </div>
      )}
    </div>
  );
}
