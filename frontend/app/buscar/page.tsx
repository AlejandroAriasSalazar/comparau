"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, MapPin, BadgeCheck, Building2 } from "lucide-react";
import { api } from "@/lib/api";
import type { Institucion } from "@/lib/types";

const SECTORES = ["", "Oficial", "Privado"];
const CARACTERES = ["", "Universidad", "Institución Universitaria/Escuela Tecnológica",
  "Institución Tecnológica", "Institución Técnica Profesional"];

export default function BuscarPage() {
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("");
  const [caracter, setCaracter] = useState("");
  const [items, setItems] = useState<Institucion[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await api.instituciones({
          q, sector, caracter_academico: caracter, limit: 24,
        });
        setItems(r.data);
        setTotal(r.meta.paginacion.total);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [q, sector, caracter]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink">Buscar instituciones</h1>
      <p className="mt-2 text-ink-soft">Filtra entre todas las IES de Colombia registradas en el SNIES.</p>

      {/* Controles */}
      <div className="mt-6 flex flex-col gap-3 md:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-surface-border bg-white px-3 shadow-card">
          <Search className="text-ink-faint" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Nombre de la universidad…"
            className="w-full bg-transparent py-3 outline-none placeholder:text-ink-faint" />
        </div>
        <select value={sector} onChange={(e) => setSector(e.target.value)}
          className="rounded-xl border border-surface-border bg-white px-4 py-3 text-ink shadow-card">
          {SECTORES.map((s) => <option key={s} value={s}>{s || "Todos los sectores"}</option>)}
        </select>
        <select value={caracter} onChange={(e) => setCaracter(e.target.value)}
          className="rounded-xl border border-surface-border bg-white px-4 py-3 text-ink shadow-card">
          {CARACTERES.map((c) => <option key={c} value={c}>{c || "Todo carácter académico"}</option>)}
        </select>
      </div>

      <div className="mt-4 text-sm text-ink-faint">{loading ? "Buscando…" : `${total} resultados`}</div>

      {/* Resultados */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <Link key={i.codigo_snies} href={`/instituciones/${i.codigo_snies}`}
            className="card p-5 transition hover:shadow-lift">
            <div className="flex items-start justify-between gap-3">
              <Building2 className="text-brand-600" size={22} />
              {i.acreditacion_institucional?.acreditada && (
                <span className="chip !border-accent-green/30 !bg-green-50 !text-accent-green">
                  <BadgeCheck size={12} /> Acreditada
                </span>
              )}
            </div>
            <h3 className="mt-3 line-clamp-2 font-semibold text-ink">{i.nombre}</h3>
            <div className="mt-2 flex items-center gap-1 text-sm text-ink-soft">
              <MapPin size={14} /> {i.domicilio?.municipio ?? "—"}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip">{i.sector}</span>
              <span className="chip">{i.caracter_academico?.split("/")[0]}</span>
            </div>
          </Link>
        ))}
      </div>

      {!loading && items.length === 0 && (
        <div className="mt-16 text-center text-ink-faint">Sin resultados. Prueba otros filtros.</div>
      )}
    </div>
  );
}
