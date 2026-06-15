import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Globe, BadgeCheck, Building2, ExternalLink, ArrowLeft, GraduationCap, Layers, Scale } from "lucide-react";
import { api } from "@/lib/api";
import type { Programa } from "@/lib/types";

export const revalidate = 3600;

export default async function InstitucionPage({ params }: { params: { codigo: string } }) {
  let inst;
  try { inst = await api.institucion(params.codigo); } catch { notFound(); }

  let programas: Programa[] = [];
  let saber: { global: number; n: number } | null = null;
  try { [programas, saber] = await Promise.all([api.programas({ codigo_institucion: params.codigo, limit: 18 }), api.saberPro(params.codigo).catch(() => null)]); } catch { /* opcional */ }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/buscar" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-brand-700"><ArrowLeft size={16} /> Volver</Link>

      <div className="card mt-4 overflow-hidden p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Building2 size={26} /></span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">{inst.nombre}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="chip">{inst.sector}</span>
                <span className="chip">{inst.caracter_academico}</span>
                {inst.acreditacion_institucional?.acreditada && <span className="chip chip-green"><BadgeCheck size={12} /> Acreditada alta calidad</span>}
              </div>
            </div>
          </div>
          <Link href="/comparar" className="btn-ghost text-sm"><Scale size={16} /> Comparar</Link>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-surface-soft p-4">
            <div className="text-xs text-ink-soft">Ubicación</div>
            <div className="mt-1 flex items-center gap-1 font-semibold text-ink"><MapPin size={15} /> {inst.domicilio?.municipio ?? "—"}</div>
          </div>
          <div className="rounded-2xl bg-surface-soft p-4">
            <div className="text-xs text-ink-soft">Saber Pro (global)</div>
            <div className="mt-1 flex items-center gap-1 font-semibold text-ink"><GraduationCap size={15} className="text-brand-600" /> {saber ? `${saber.global} pts` : "—"}</div>
          </div>
          <div className="rounded-2xl bg-surface-soft p-4">
            <div className="text-xs text-ink-soft">Programas activos</div>
            <div className="mt-1 flex items-center gap-1 font-semibold text-ink"><Layers size={15} className="text-violet-600" /> {programas.length}{programas.length === 18 ? "+" : ""}</div>
          </div>
        </div>

        {inst.sitio_web && (
          <a href={inst.sitio_web} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm text-brand-700 hover:underline">
            <Globe size={16} /> Sitio web oficial <ExternalLink size={12} />
          </a>
        )}
      </div>

      {programas.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-ink">Programas</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {programas.map((p) => (
              <div key={p.uid} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-ink">{p.nombre}</div>
                  {p.acreditado && <span className="chip chip-green"><BadgeCheck size={12} /> Alta calidad</span>}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="chip chip-brand">{p.nivel_academico}</span>
                  {p.nivel_formacion && <span className="chip">{p.nivel_formacion}</span>}
                  {p.metodologia && <span className="chip">{p.metodologia}</span>}
                  {p.creditos != null && <span className="chip">{p.creditos} créditos</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="mt-8 text-xs text-ink-faint">Fuente: {inst.fuente?.sistema} · dataset {inst.fuente?.dataset_id} · licencia {inst.fuente?.licencia ?? "CC BY-SA 4.0"} (datos.gov.co).</p>
    </div>
  );
}
