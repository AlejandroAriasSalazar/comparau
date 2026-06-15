"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, MapPin, BadgeCheck, Building2, BookOpen, Layers } from "lucide-react";
import { api } from "@/lib/api";
import type { Institucion, Programa } from "@/lib/types";

type Modo = "universidades" | "programas";
const SECTORES = ["", "Oficial", "Privado"];
const CARACTERES = ["", "Universidad", "Institución Universitaria/Escuela Tecnológica", "Institución Tecnológica", "Institución Técnica Profesional"];

export default function BuscarPage() {
  const [modo, setModo] = useState<Modo>("universidades");
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("");
  const [caracter, setCaracter] = useState("");
  const [insts, setInsts] = useState<Institucion[]>([]);
  const [progs, setProgs] = useState<Programa[]>([]);
  const [loading, setLoading] = useState(false);

  const seqRef = useRef(0);
  useEffect(() => {
    const t = setTimeout(async () => {
      const seq = ++seqRef.current;
      setLoading(true);
      try {
        if (modo === "universidades") {
          const data = (await api.instituciones({ q, sector, caracter_academico: caracter, limit: 24 })).data;
          if (seq === seqRef.current) setInsts(data);
        } else {
          const r = await api.programas({ q, limit: 30 });
          if (seq === seqRef.current) setProgs(r);
        }
      } catch { if (seq === seqRef.current) { setInsts([]); setProgs([]); } }
      finally { if (seq === seqRef.current) setLoading(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [q, sector, caracter, modo]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-ink">Explora la educación superior de Colombia</h1>
      <p className="mt-2 text-ink-soft">Todo en vivo desde el SNIES (datos abiertos del Ministerio de Educación).</p>

      <div className="mt-6 seg">
        <button className="seg-btn inline-flex items-center gap-2" data-active={modo === "universidades"} onClick={() => setModo("universidades")}><Building2 size={16} /> Universidades</button>
        <button className="seg-btn inline-flex items-center gap-2" data-active={modo === "programas"} onClick={() => setModo("programas")}><BookOpen size={16} /> Programas</button>
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-2xl border border-surface-border bg-white px-3 shadow-card">
          <Search className="text-ink-faint" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder={modo === "universidades" ? "Nombre de la universidad…" : "Carrera o programa (ej. psicología)…"}
            className="w-full bg-transparent py-3 outline-none placeholder:text-ink-faint" />
        </div>
        {modo === "universidades" && (
          <>
            <select value={sector} onChange={(e) => setSector(e.target.value)} className="rounded-2xl border border-surface-border bg-white px-4 py-3 text-ink shadow-card">
              {SECTORES.map((s) => <option key={s} value={s}>{s || "Todos los sectores"}</option>)}
            </select>
            <select value={caracter} onChange={(e) => setCaracter(e.target.value)} className="rounded-2xl border border-surface-border bg-white px-4 py-3 text-ink shadow-card">
              {CARACTERES.map((c) => <option key={c} value={c}>{c || "Todo carácter"}</option>)}
            </select>
          </>
        )}
      </div>

      <div className="mt-4 text-sm text-ink-faint">
        {loading ? "Buscando…" : modo === "universidades" ? `${insts.length} universidades` : `${progs.length} programas`}
      </div>

      {/* Universidades */}
      {modo === "universidades" && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {insts.map((i) => (
            <Link key={i.codigo_snies} href={`/instituciones/${i.codigo_snies}`} className="card card-hover p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><Building2 size={20} /></span>
                {i.acreditacion_institucional?.acreditada && <span className="chip chip-green"><BadgeCheck size={12} /> Acreditada</span>}
              </div>
              <h3 className="mt-3 line-clamp-2 font-semibold text-ink">{i.nombre}</h3>
              <div className="mt-2 flex items-center gap-1 text-sm text-ink-soft"><MapPin size={14} /> {i.domicilio?.municipio ?? "—"}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="chip">{i.sector}</span>
                <span className="chip">{i.caracter_academico?.split("/")[0]}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Programas */}
      {modo === "programas" && (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {progs.map((p) => (
            <Link key={p.uid} href={`/instituciones/${p.codigo_institucion}`} className="card card-hover p-5">
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-600"><Layers size={20} /></span>
                {p.acreditado && <span className="chip chip-green"><BadgeCheck size={12} /> Alta calidad</span>}
              </div>
              <h3 className="mt-3 line-clamp-2 font-semibold text-ink">{p.nombre}</h3>
              <div className="mt-1 line-clamp-1 text-sm text-ink-soft">{p.institucion}</div>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="chip chip-brand">{p.nivel_academico}</span>
                {p.metodologia && <span className="chip">{p.metodologia}</span>}
                {p.municipio && <span className="chip">{p.municipio}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {!loading && ((modo === "universidades" && !insts.length) || (modo === "programas" && !progs.length)) && (
        <div className="mt-16 text-center text-ink-faint">Sin resultados. Prueba otra búsqueda.</div>
      )}
    </div>
  );
}
