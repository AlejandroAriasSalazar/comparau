"use client";
import { useState } from "react";
import { Plus, X, Scale, AlertTriangle, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";
import type { Institucion, Comparacion } from "@/lib/types";

export default function CompararPage() {
  const [seleccion, setSeleccion] = useState<Institucion[]>([]);
  const [q, setQ] = useState("");
  const [sugerencias, setSugerencias] = useState<Institucion[]>([]);
  const [resultado, setResultado] = useState<Comparacion | null>(null);
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
      const r = await api.comparar("instituciones", seleccion.map((s) => s.codigo_snies));
      setResultado(r);
    } finally { setCargando(false); }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center gap-2">
        <Scale className="text-brand-600" size={26} />
        <h1 className="text-3xl font-bold tracking-tight text-ink">Comparar universidades</h1>
      </div>
      <p className="mt-2 text-ink-soft">Elige de 2 a 5 instituciones. Mostramos cada indicador oficial con su año y fuente.</p>

      {/* Selección */}
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

      {/* Resultado */}
      {resultado && (
        <div className="mt-10">
          {resultado.advertencias?.length > 0 && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-accent-amber/30 bg-amber-50 p-4 text-sm text-amber-800">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
              <ul className="space-y-1">{resultado.advertencias.map((a, k) => <li key={k}>{a}</li>)}</ul>
            </div>
          )}
          <div className="card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-surface-border bg-surface-soft">
                <tr className="text-left">
                  <th className="px-5 py-3 font-medium text-ink-soft">Indicador</th>
                  {resultado.entidades.map((e) => (
                    <th key={e.codigo_snies} className="px-4 py-3 font-semibold text-ink">{e.nombre}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {resultado.indicadores.map((fila) => (
                  <tr key={fila.clave}>
                    <td className="px-5 py-3 text-ink-soft">
                      {fila.etiqueta}
                      <span className="ml-2 text-xs text-ink-faint">{fila.unidad}</span>
                    </td>
                    {fila.valores.map((v) => (
                      <td key={v.codigo_snies} className="px-4 py-3 font-semibold text-ink">
                        {v.valor ?? <span className="text-ink-faint">—</span>}
                        {v.anio && <span className="ml-1 text-xs font-normal text-ink-faint">({v.anio})</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-ink-faint">
            <ShieldCheck size={14} /> {resultado.meta?.nota_metodologica}
          </p>
        </div>
      )}
    </div>
  );
}
