import Link from "next/link";
import {
  Search, Scale, ShieldCheck, GraduationCap, Briefcase, TrendingUp,
  BadgeCheck, ArrowRight, Building2, BookOpen,
} from "lucide-react";

const FUENTES = [
  { sigla: "SNIES", desc: "Instituciones y programas", autoridad: "MinEducación" },
  { sigla: "ICFES", desc: "Saber Pro · calidad", autoridad: "ICFES" },
  { sigla: "OLE", desc: "Empleabilidad e ingreso", autoridad: "MinEducación" },
  { sigla: "SPADIES", desc: "Deserción y permanencia", autoridad: "MinEducación" },
  { sigla: "CNA", desc: "Acreditación alta calidad", autoridad: "CESU" },
  { sigla: "DANE", desc: "Geografía DIVIPOLA", autoridad: "DANE" },
];

const INDICADORES = [
  { icon: GraduationCap, color: "text-brand-600", title: "Calidad", desc: "Resultados Saber Pro por institución y programa (ICFES)." },
  { icon: Briefcase, color: "text-accent-teal", title: "Empleabilidad", desc: "Tasa de vinculación laboral formal de los recién graduados (OLE)." },
  { icon: TrendingUp, color: "text-accent-green", title: "Ingreso de enganche", desc: "Salario mediano de enganche por programa y nivel (OLE)." },
  { icon: Scale, color: "text-accent-amber", title: "Permanencia", desc: "Deserción, permanencia y graduación por cohorte (SPADIES)." },
];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero-bg relative overflow-hidden">
        <div className="grid-bg absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-20 text-center">
          <span className="chip mx-auto animate-fade-up">
            <ShieldCheck size={14} className="text-brand-600" /> 100% datos oficiales y verificables
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl animate-fade-up text-4xl font-extrabold leading-[1.08] tracking-tight text-ink sm:text-6xl">
            Compara universidades de Colombia <span className="text-brand-600">con datos reales</span>, no con opiniones
          </h1>
          <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-lg text-ink-soft">
            Todas las instituciones y programas del país, con indicadores oficiales de calidad,
            empleabilidad, salario de enganche y permanencia. Cada dato apunta a su fuente.
          </p>

          {/* Buscador */}
          <div className="mx-auto mt-9 flex max-w-xl animate-fade-up items-center gap-2 rounded-2xl border border-surface-border bg-white p-2 shadow-card">
            <Search className="ml-3 text-ink-faint" size={20} />
            <input
              type="text"
              placeholder="Busca una universidad o programa…"
              className="w-full bg-transparent px-2 py-2.5 text-ink outline-none placeholder:text-ink-faint"
            />
            <Link href="/buscar" className="btn-primary !py-2.5">Buscar</Link>
          </div>

          <div className="mt-6 flex animate-fade-up flex-wrap items-center justify-center gap-3 text-sm">
            <Link href="/comparar" className="btn-ghost">
              <Scale size={16} /> Comparar universidades
            </Link>
            <span className="text-ink-faint">o explora por carácter, sector y ciudad</span>
          </div>

          {/* Métricas */}
          <div className="mx-auto mt-14 grid max-w-3xl animate-fade-up grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { n: "361", l: "Instituciones (IES)" },
              { n: "+30 000", l: "Programas" },
              { n: "9", l: "Fuentes oficiales" },
              { n: "100%", l: "Verificable" },
            ].map((m) => (
              <div key={m.l} className="card px-4 py-5">
                <div className="text-2xl font-extrabold text-brand-600">{m.n}</div>
                <div className="mt-1 text-xs font-medium text-ink-soft">{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INDICADORES */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink">Compara lo que de verdad importa</h2>
          <p className="mt-3 text-ink-soft">
            No es un directorio: son los indicadores que responden si se aprende, si se consigue empleo
            y cuánto se gana, y si se logra terminar.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {INDICADORES.map((i) => (
            <div key={i.title} className="card p-6 transition hover:shadow-lift">
              <i.icon className={i.color} size={28} />
              <h3 className="mt-4 font-semibold text-ink">{i.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{i.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como" className="border-y border-surface-border bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="chip"><Scale size={14} className="text-brand-600" /> Comparación honesta</span>
              <h2 className="mt-5 text-3xl font-bold tracking-tight text-ink">
                Cada cosa, con su propia regla oficial
              </h2>
              <p className="mt-4 text-ink-soft">
                comparaU <strong>no inventa un puntaje único</strong>. El índice oficial MIDE fue
                descontinuado, así que mostramos cada indicador tal como lo publican ICFES, OLE y
                SPADIES, con su año y su fuente, y te avisamos cuando dos valores no son comparables.
                La ponderación la decides tú.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-ink">
                {[
                  "Elige de 2 a 5 universidades o programas",
                  "Mira calidad, empleabilidad, ingreso y permanencia lado a lado",
                  "Cada celda enlaza a la fuente oficial que la respalda",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <BadgeCheck className="mt-0.5 shrink-0 text-accent-green" size={18} /> {t}
                  </li>
                ))}
              </ul>
              <Link href="/comparar" className="btn-primary mt-8">
                Probar el comparador <ArrowRight size={16} />
              </Link>
            </div>

            {/* Mock de tabla de comparación */}
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 border-b border-surface-border bg-surface-soft px-5 py-3 text-sm font-semibold text-ink-soft">
                <Scale size={16} className="text-brand-600" /> Comparación
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-ink-faint">
                    <th className="px-5 py-3 font-medium">Indicador</th>
                    <th className="px-3 py-3 font-medium">U. Nacional</th>
                    <th className="px-3 py-3 font-medium">U. de los Andes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {[
                    ["Saber Pro (global)", "168", "175", "right"],
                    ["Empleabilidad", "82%", "88%", "right"],
                    ["Ingreso enganche", "$2.6M", "$3.4M", "right"],
                    ["Deserción anual", "9%", "6%", "left"],
                    ["Acreditación", "Sí · 10a", "Sí · 10a", "eq"],
                  ].map(([k, a, b, best]) => (
                    <tr key={k as string}>
                      <td className="px-5 py-3 text-ink-soft">{k}</td>
                      <td className={`px-3 py-3 font-semibold ${best === "left" ? "text-accent-green" : "text-ink"}`}>{a}</td>
                      <td className={`px-3 py-3 font-semibold ${best === "right" ? "text-accent-green" : "text-ink"}`}>{b}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="border-t border-surface-border px-5 py-3 text-[11px] text-ink-faint">
                Datos ilustrativos. En producción provienen de ICFES, OLE y SPADIES con su año y fuente.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FUENTES */}
      <section id="fuentes" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span className="chip mx-auto"><ShieldCheck size={14} className="text-brand-600" /> Trazabilidad total</span>
          <h2 className="mt-5 text-3xl font-bold tracking-tight text-ink">Solo fuentes oficiales</h2>
          <p className="mt-3 text-ink-soft">
            Cada dato que ves viene del Estado colombiano y es verificable contra su portal original.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FUENTES.map((f) => (
            <div key={f.sigla} className="card flex items-center gap-4 p-5">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 font-bold text-brand-700">
                {f.sigla.slice(0, 2)}
              </span>
              <div>
                <div className="font-semibold text-ink">{f.sigla}</div>
                <div className="text-sm text-ink-soft">{f.desc}</div>
                <div className="text-xs text-ink-faint">{f.autoridad}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl bg-brand-600 px-8 py-14 text-center shadow-lift">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Elige tu universidad con datos, no con marketing
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-100">
            Empieza a comparar instituciones y programas de Colombia en segundos.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/comparar" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-brand-700 transition hover:bg-brand-50">
              <Building2 size={18} /> Comparar universidades
            </Link>
            <Link href="/buscar" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10">
              <BookOpen size={18} /> Explorar programas
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
