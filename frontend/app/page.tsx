import Link from "next/link";
import {
  Search, Scale, ShieldCheck, GraduationCap, Sparkles, ArrowRight, Building2,
  BookOpen, Users, Heart, BadgeCheck, MapPin, Layers,
} from "lucide-react";

const FUENTES = [
  { sigla: "SNIES", desc: "Instituciones y programas" },
  { sigla: "ICFES", desc: "Saber Pro · calidad" },
  { sigla: "datos.gov.co", desc: "Datos abiertos del Estado" },
  { sigla: "CNA", desc: "Acreditación alta calidad" },
];

const COMO = [
  { icon: Search, color: "text-brand-600", title: "Busca", desc: "Encuentra cualquier universidad o programa del país." },
  { icon: Scale, color: "text-violet-600", title: "Compara", desc: "Ponlas lado a lado con datos oficiales, no opiniones." },
  { icon: BadgeCheck, color: "text-accent-teal", title: "Decide", desc: "Elige con confianza, con evidencia real en la mano." },
];

export default function Home() {
  return (
    <>
      {/* HERO */}
      <section className="hero-bg relative overflow-hidden">
        <div className="grid-bg absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-16 text-center sm:pt-24">
          <span className="chip chip-brand mx-auto animate-fade-up !text-sm">
            <Sparkles size={15} /> Datos 100% oficiales y verificables
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl animate-fade-up text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-6xl">
            Elige tu universidad <span className="grad-text">con datos reales</span>,<br className="hidden sm:block" /> no con marketing
          </h1>
          <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-lg text-ink-soft">
            Compara universidades y programas de Colombia por calidad, acreditación y más.
            Hecho para que estudiantes y familias decidan tranquilos.
          </p>

          <div className="mx-auto mt-9 flex max-w-xl animate-fade-up items-center gap-2 rounded-3xl border border-surface-border bg-white p-2 shadow-glow">
            <Search className="ml-3 text-ink-faint" size={20} />
            <input type="text" placeholder="Busca una universidad o un programa…"
              className="w-full bg-transparent px-2 py-2.5 text-ink outline-none placeholder:text-ink-faint" />
            <Link href="/buscar" className="btn-primary !py-2.5">Buscar</Link>
          </div>

          <div className="mt-6 flex animate-fade-up flex-wrap items-center justify-center gap-3">
            <Link href="/comparar" className="btn-primary"><Building2 size={18} /> Comparar universidades</Link>
            <Link href="/comparar?modo=programas" className="btn-ghost"><BookOpen size={18} /> Comparar programas</Link>
          </div>

          <div className="mx-auto mt-14 grid max-w-3xl animate-fade-up grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { n: "360+", l: "Universidades (IES)" },
              { n: "+30 000", l: "Programas" },
              { n: "Saber Pro", l: "Calidad real" },
              { n: "100%", l: "Verificable" },
            ].map((m) => (
              <div key={m.l} className="card px-4 py-5">
                <div className="grad-text text-2xl font-extrabold">{m.n}</div>
                <div className="mt-1 text-xs font-medium text-ink-soft">{m.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CÓMO FUNCIONA */}
      <section id="como" className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink">Decidir bien es muy fácil</h2>
          <p className="mt-3 text-ink-soft">Tres pasos. Cero letra menuda.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-3">
          {COMO.map((c, i) => (
            <div key={c.title} className="card card-hover p-6">
              <div className="flex items-center justify-between">
                <c.icon className={c.color} size={30} />
                <span className="text-5xl font-extrabold text-surface-border">{i + 1}</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-ink">{c.title}</h3>
              <p className="mt-2 text-sm text-ink-soft">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PARA ESTUDIANTES / PARA FAMILIAS */}
      <section className="border-y border-surface-border bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card card-hover overflow-hidden p-8">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-600"><Users size={24} /></span>
              <h3 className="mt-4 text-2xl font-bold text-ink">Para estudiantes</h3>
              <p className="mt-2 text-ink-soft">Encuentra el programa que va contigo. Compara modalidad, duración, créditos, acreditación y resultados Saber Pro sin perderte entre folletos.</p>
              <ul className="mt-5 space-y-2 text-sm text-ink">
                {["Busca por carrera o universidad", "Mira la calidad académica real", "Compara hasta 5 a la vez"].map((t) => (
                  <li key={t} className="flex items-center gap-2"><BadgeCheck size={16} className="text-brand-600" /> {t}</li>
                ))}
              </ul>
            </div>
            <div className="card card-hover overflow-hidden p-8">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-600"><Heart size={24} /></span>
              <h3 className="mt-4 text-2xl font-bold text-ink">Para familias</h3>
              <p className="mt-2 text-ink-soft">Acompaña la decisión con tranquilidad. Toda la información viene de fuentes oficiales del Estado: nada de rankings inventados ni publicidad.</p>
              <ul className="mt-5 space-y-2 text-sm text-ink">
                {["Datos verificables del Ministerio e ICFES", "Acreditación de alta calidad a la vista", "Comparación clara y sin sesgos"].map((t) => (
                  <li key={t} className="flex items-center gap-2"><ShieldCheck size={16} className="text-violet-600" /> {t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* QUÉ COMPARAS */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-ink">Compara lo que de verdad importa</h2>
          <p className="mt-3 text-ink-soft">Atributos oficiales y calidad académica, lado a lado.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: GraduationCap, color: "text-brand-600", t: "Calidad", d: "Promedio Saber Pro real (ICFES)." },
            { icon: BadgeCheck, color: "text-accent-teal", t: "Acreditación", d: "Alta calidad y su vigencia (CNA)." },
            { icon: Layers, color: "text-violet-600", t: "Programas", d: "Modalidad, créditos y duración." },
            { icon: MapPin, color: "text-accent-sky", t: "Ubicación", d: "Ciudad, sector y carácter académico." },
          ].map((i) => (
            <div key={i.t} className="card card-hover p-6">
              <i.icon className={i.color} size={28} />
              <h3 className="mt-4 font-semibold text-ink">{i.t}</h3>
              <p className="mt-2 text-sm text-ink-soft">{i.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FUENTES */}
      <section id="fuentes" className="border-t border-surface-border bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <div className="mx-auto max-w-2xl text-center">
            <span className="chip chip-green mx-auto"><ShieldCheck size={14} /> Trazabilidad total</span>
            <h2 className="mt-5 text-3xl font-bold tracking-tight text-ink">Solo fuentes oficiales</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FUENTES.map((f) => (
              <div key={f.sigla} className="card flex items-center gap-4 p-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-50 text-sm font-bold text-brand-700">{f.sigla.slice(0, 2)}</span>
                <div>
                  <div className="font-semibold text-ink">{f.sigla}</div>
                  <div className="text-sm text-ink-soft">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-4 py-20">
        <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl px-8 py-16 text-center shadow-lift"
          style={{ backgroundImage: "linear-gradient(110deg, #4f46e5, #7c3aed 55%, #0ea5e9)" }}>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Tu futuro merece una buena decisión</h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-100">Compara universidades y programas de Colombia en segundos, con datos reales.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/comparar" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3 font-semibold text-brand-700 transition hover:bg-brand-50"><Scale size={18} /> Comparar ahora</Link>
            <Link href="/buscar" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/30 px-6 py-3 font-semibold text-white transition hover:bg-white/10"><ArrowRight size={18} /> Explorar</Link>
          </div>
        </div>
      </section>
    </>
  );
}
