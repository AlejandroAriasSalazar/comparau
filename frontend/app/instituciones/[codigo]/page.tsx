import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Globe, BadgeCheck, Building2, ExternalLink, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";

export const revalidate = 3600; // ISR

export default async function InstitucionPage({ params }: { params: { codigo: string } }) {
  let inst;
  try {
    inst = await api.institucion(params.codigo);
  } catch {
    notFound();
  }
  let programas: Awaited<ReturnType<typeof api.programas>> | null = null;
  try {
    programas = await api.programas({ codigo_institucion: params.codigo, limit: 12 });
  } catch { /* opcional */ }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/buscar" className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-brand-700">
        <ArrowLeft size={16} /> Volver
      </Link>

      <div className="card mt-4 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand-700">
              <Building2 size={26} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">{inst.nombre}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="chip">{inst.sector}</span>
                <span className="chip">{inst.caracter_academico}</span>
                {inst.acreditacion_institucional?.acreditada && (
                  <span className="chip !border-accent-green/30 !bg-green-50 !text-accent-green">
                    <BadgeCheck size={12} /> Acreditada alta calidad
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link href={`/comparar`} className="btn-ghost text-sm">Comparar</Link>
        </div>

        <div className="mt-6 grid gap-4 text-sm sm:grid-cols-2">
          <div className="flex items-center gap-2 text-ink-soft">
            <MapPin size={16} /> {inst.domicilio?.municipio}, {inst.domicilio?.departamento}
          </div>
          {inst.sitio_web && (
            <a href={inst.sitio_web} target="_blank" rel="noreferrer"
              className="flex items-center gap-2 text-brand-700 hover:underline">
              <Globe size={16} /> Sitio web oficial <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>

      {/* Programas */}
      {programas && programas.data.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-ink">Programas</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {programas.data.map((p) => (
              <div key={p.codigo_snies} className="card p-4">
                <div className="font-medium text-ink">{p.nombre}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="chip">{p.nivel_academico}</span>
                  {p.nivel_formacion && <span className="chip">{p.nivel_formacion}</span>}
                  {p.metodologia && <span className="chip">{p.metodologia}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Fuente */}
      <p className="mt-8 text-xs text-ink-faint">
        Fuente: {inst.fuente?.sistema} · dataset {inst.fuente?.dataset_id} · licencia {inst.fuente?.licencia ?? "CC BY-SA 4.0"}.
      </p>
    </div>
  );
}
