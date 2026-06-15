"use client";
import { useState } from "react";
import { Plus, X, Scale, ShieldCheck, BadgeCheck, GraduationCap } from "lucide-react";
import { api } from "@/lib/api";
import type { Institucion } from "@/lib/types";

type Comparada = Institucion & {
  totalProgramas?: number;
  saberPro?: { global: number; n: number } | null;
};

type Fila = {
  etiqueta: string;
  texto: (i: Comparada) => string;
  num?: (i: Comparada) => number | null; // para resaltar el "mejor" (mayor)
  icono?: boolean;
};

const FILAS: Fila[] = [
  { etiqueta: "Sector", texto: (i) => i.sector },
  { etiqueta: "Carácter académico", texto: (i) => i.caracter_academico },
  { etiqueta: "Naturaleza jurídica", texto: (i) => i.naturaleza_juridica ?? "—" },
  {
    etiqueta: "Acreditación alta calidad", icono: true,
    texto: (i) => i.acreditacion_institucional?.acreditada
      ? `Sí${i.acreditacion_institucional.vigencia_anios ? ` · ${i.acreditacion_institucional.vigencia_anios} años` : ""}` : "No",
  },
  {
    etiqueta: "Saber Pro (promedio global)",
    texto: (i) => (i.saberPro ? `${i.saberPro.global} pts` : "—"),
    num: (i) => i.saberPro?.global ?? null,
  },
  { etiqueta: "Ciudad", texto: (i) => i.domicilio?.municipio ?? "—" },
  { etiqueta: "Departamento", texto: (i) => i.domicilio?.departamento ?? "—" },
  {
    etiqueta: "Programas activos",
    texto: (i) => (i.totalProgramas != null ? String(i.totalProgramas) : "—"),
    num: (i) => i.totalProgramas ?? null,
  },
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
          const [totalProgramas, saberPro] = await Promise.all([
            api.conteoProgramas(s.codigo_snies).catch(() => undefined),
            api.saberPro(s.codigo_snies).catch(() => null),
          ]);
          return { ...s, totalProgramas, saberPro };
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
        Elige de 2 a 5 instituciones. Todo en vivo desde fuentes oficiales: catálogo del SNIES y resultados Saber Pro del ICFES.
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
                  const nums = fila.num ? resultado.map((e) => fila.num!(e)) : null;
                  const max = nums ? Math.max(...nums.map((n) => (n ?? -Infinity))) : null;
                  return (
                    <tr key={fila.etiqueta}>
                      <td className="px-5 py-3 text-ink-soft">{fila.etiqueta}</td>
                      {resultado.map((e, idx) => {
                        const txt = fila.texto(e);
                        const destaca = nums != null && max != null && max > -Infinity && nums[idx] === max;
                        return (
                          <td key={e.codigo_snies} className={`px-4 py-3 font-semibold ${destaca ? "text-accent-green" : "text-ink"}`}>
                            {fila.icono && txt.startsWith("Sí") ? (
                              <span className="inline-flex items-center gap-1"><BadgeCheck size={14} className="text-accent-green" /> {txt}</span>
                            ) : fila.etiqueta.startsWith("Saber Pro") && txt !== "—" ? (
                              <span className="inline-flex items-center gap-1"><GraduationCap size={14} className="text-brand-600" /> {txt}</span>
                            ) : txt}
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
            <ShieldCheck size={14} /> Datos oficiales en vivo: catálogo SNIES (datos.gov.co) y promedio Saber Pro del ICFES
            (promedio de las 5 competencias genéricas, dataset u37r-hjmu · CC BY-SA 4.0).
            Empleabilidad (OLE) y permanencia (SPADIES) se añadirán con el backend.
          </p>
        </div>
      )}
    </div>
  );
}
