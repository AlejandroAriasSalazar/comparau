"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Plus, X, Scale, ShieldCheck, BadgeCheck, GraduationCap, Building2, BookOpen } from "lucide-react";
import { api } from "@/lib/api";
import type { Institucion, Programa } from "@/lib/types";

type Modo = "universidades" | "programas";
type UniComp = Institucion & { totalProgramas?: number; saberPro?: { global: number; n: number } | null };

type FilaU = { etiqueta: string; texto: (i: UniComp) => string; num?: (i: UniComp) => number | null; icono?: boolean };
const FILAS_U: FilaU[] = [
  { etiqueta: "Sector", texto: (i) => i.sector },
  { etiqueta: "Carácter académico", texto: (i) => i.caracter_academico },
  { etiqueta: "Naturaleza jurídica", texto: (i) => i.naturaleza_juridica ?? "—" },
  { etiqueta: "Acreditación alta calidad", icono: true, texto: (i) => i.acreditacion_institucional?.acreditada ? `Sí${i.acreditacion_institucional.vigencia_anios ? ` · ${i.acreditacion_institucional.vigencia_anios} años` : ""}` : "No" },
  { etiqueta: "Saber Pro (promedio global)", texto: (i) => (i.saberPro ? `${i.saberPro.global} pts` : "—"), num: (i) => i.saberPro?.global ?? null },
  { etiqueta: "Ciudad", texto: (i) => i.domicilio?.municipio ?? "—" },
  { etiqueta: "Programas activos", texto: (i) => (i.totalProgramas != null ? String(i.totalProgramas) : "—"), num: (i) => i.totalProgramas ?? null },
];

type FilaP = { etiqueta: string; texto: (p: Programa) => string; icono?: boolean };
const FILAS_P: FilaP[] = [
  { etiqueta: "Institución", texto: (p) => p.institucion },
  { etiqueta: "Nivel", texto: (p) => `${p.nivel_academico}${p.nivel_formacion ? ` · ${p.nivel_formacion}` : ""}` },
  { etiqueta: "Área de conocimiento", texto: (p) => p.area ?? p.nbc ?? "—" },
  { etiqueta: "Modalidad", texto: (p) => p.metodologia ?? "—" },
  { etiqueta: "Créditos", texto: (p) => (p.creditos != null ? String(p.creditos) : "—") },
  { etiqueta: "Duración", texto: (p) => (p.periodos != null ? `${p.periodos} ${p.periodicidad === "Anual" ? "años" : "semestres"}` : "—") },
  { etiqueta: "Ciudad", texto: (p) => p.municipio ?? "—" },
  { etiqueta: "Acreditación", icono: true, texto: (p) => p.acreditado ? `Alta calidad${p.anios_acreditados ? ` · ${p.anios_acreditados} años` : ""}` : (p.tipo_acreditacion ?? "Registro calificado") },
];

export default function CompararPage() {
  const [modo, setModo] = useState<Modo>("universidades");
  const [selU, setSelU] = useState<Institucion[]>([]);
  const [selP, setSelP] = useState<Programa[]>([]);
  const [q, setQ] = useState("");
  const [sugU, setSugU] = useState<Institucion[]>([]);
  const [sugP, setSugP] = useState<Programa[]>([]);
  const [resU, setResU] = useState<UniComp[] | null>(null);
  const [resP, setResP] = useState<Programa[] | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("modo") === "programas") setModo("programas");
  }, []);

  function cambiarModo(m: Modo) { setModo(m); setQ(""); setSugU([]); setSugP([]); setResU(null); setResP(null); }

  // Antirrebote + guarda de orden: cada tecla cancela el temporizador anterior y solo
  // se pintan los resultados de la ÚLTIMA consulta (evita que una respuesta lenta de una
  // búsqueda parcial llegue tarde y reemplace a la correcta).
  const seqRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  function buscar(texto: string) {
    setQ(texto);
    const t = texto.trim();
    if (timerRef.current) clearTimeout(timerRef.current);
    if (t.length < 3) { setSugU([]); setSugP([]); return; }
    timerRef.current = setTimeout(async () => {
      const seq = ++seqRef.current;
      try {
        if (modo === "universidades") {
          const data = (await api.instituciones({ q: t, limit: 6 })).data;
          if (seq === seqRef.current) setSugU(data);
        } else {
          const r = await api.programas({ q: t, limit: 8 });
          if (seq === seqRef.current) setSugP(r);
        }
      } catch { if (seq === seqRef.current) { setSugU([]); setSugP([]); } }
    }, 220);
  }

  function addU(i: Institucion) { if (selU.length < 5 && !selU.find((s) => s.codigo_snies === i.codigo_snies)) setSelU([...selU, i]); setQ(""); setSugU([]); }
  function addP(p: Programa) { if (selP.length < 5 && !selP.find((s) => s.uid === p.uid)) setSelP([...selP, p]); setQ(""); setSugP([]); }

  async function comparar() {
    setCargando(true);
    try {
      if (modo === "universidades") {
        if (selU.length < 2) return;
        setResU(await Promise.all(selU.map(async (s) => {
          const [totalProgramas, saberPro] = await Promise.all([
            api.conteoProgramas(s.codigo_snies).catch(() => undefined),
            api.saberPro(s.codigo_snies).catch(() => null),
          ]);
          return { ...s, totalProgramas, saberPro };
        })));
      } else {
        if (selP.length < 2) return;
        setResP([...selP]);
      }
    } finally { setCargando(false); }
  }

  const sel = modo === "universidades" ? selU : selP;
  const sugerencias = modo === "universidades" ? sugU : sugP;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center gap-2">
        <Scale className="text-brand-600" size={26} />
        <h1 className="text-3xl font-bold tracking-tight text-ink">Comparar</h1>
      </div>
      <p className="mt-2 text-ink-soft">Elige de 2 a 5 y míralas lado a lado. Todo en vivo desde fuentes oficiales.</p>

      {/* Toggle */}
      <div className="mt-6 seg">
        <button className="seg-btn inline-flex items-center gap-2" data-active={modo === "universidades"} onClick={() => cambiarModo("universidades")}>
          <Building2 size={16} /> Universidades
        </button>
        <button className="seg-btn inline-flex items-center gap-2" data-active={modo === "programas"} onClick={() => cambiarModo("programas")}>
          <BookOpen size={16} /> Programas
        </button>
      </div>

      {/* Selección */}
      <div className="mt-5 flex flex-wrap gap-2">
        {modo === "universidades" && selU.map((s) => (
          <span key={s.codigo_snies} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800">
            {s.nombre.length > 32 ? s.nombre.slice(0, 32) + "…" : s.nombre}
            <button onClick={() => setSelU(selU.filter((x) => x.codigo_snies !== s.codigo_snies))}><X size={14} /></button>
          </span>
        ))}
        {modo === "programas" && selP.map((s) => (
          <span key={s.uid} className="inline-flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800">
            {s.nombre} · {s.institucion.length > 22 ? s.institucion.slice(0, 22) + "…" : s.institucion}
            <button onClick={() => setSelP(selP.filter((x) => x.uid !== s.uid))}><X size={14} /></button>
          </span>
        ))}
        {sel.length < 5 && (
          <div className="relative">
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-surface-border bg-white px-3 py-2">
              <Plus size={16} className="text-ink-faint" />
              <input value={q} onChange={(e) => buscar(e.target.value)}
                placeholder={modo === "universidades" ? "Añadir universidad…" : "Añadir programa (carrera)…"}
                className="w-56 bg-transparent text-sm outline-none placeholder:text-ink-faint" />
            </div>
            {sugerencias.length > 0 && (
              <ul className="card absolute z-20 mt-1 w-80 overflow-hidden p-1">
                {modo === "universidades" && sugU.map((i) => (
                  <li key={i.codigo_snies}><button onClick={() => addU(i)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-soft">{i.nombre}</button></li>
                ))}
                {modo === "programas" && sugP.map((p) => (
                  <li key={p.uid}><button onClick={() => addP(p)} className="w-full rounded-lg px-3 py-2 text-left hover:bg-surface-soft">
                    <div className="text-sm font-medium text-ink">{p.nombre}</div>
                    <div className="text-xs text-ink-faint">{p.institucion} · {p.nivel_academico}{p.municipio ? ` · ${p.municipio}` : ""}</div>
                    {(p.nbc || p.area) && <div className="mt-0.5 truncate text-[11px] text-brand-700/70">{p.nbc ?? p.area}</div>}
                  </button></li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <button onClick={comparar} disabled={sel.length < 2 || cargando} className="btn-primary mt-6 disabled:opacity-40">
        {cargando ? "Comparando…" : "Comparar"}
      </button>

      {/* Resultado universidades */}
      {modo === "universidades" && resU && (
        <Tabla cabeceras={resU.map((e) => ({ key: e.codigo_snies, nombre: e.nombre }))}>
          {FILAS_U.map((fila) => {
            const nums = fila.num ? resU.map((e) => fila.num!(e)) : null;
            const max = nums ? Math.max(...nums.map((n) => n ?? -Infinity)) : null;
            return (
              <tr key={fila.etiqueta}>
                <td className="px-5 py-3 text-ink-soft">{fila.etiqueta}</td>
                {resU.map((e, idx) => {
                  const txt = fila.texto(e);
                  const win = nums != null && max != null && max > -Infinity && nums[idx] === max;
                  return <Celda key={e.codigo_snies} txt={txt} win={win} icono={fila.icono} saber={fila.etiqueta.startsWith("Saber")} />;
                })}
              </tr>
            );
          })}
        </Tabla>
      )}

      {/* Resultado programas */}
      {modo === "programas" && resP && (
        <Tabla cabeceras={resP.map((p) => ({ key: p.uid, nombre: `${p.nombre} · ${p.institucion}` }))}>
          {FILAS_P.map((fila) => (
            <tr key={fila.etiqueta}>
              <td className="px-5 py-3 text-ink-soft">{fila.etiqueta}</td>
              {resP.map((p) => <Celda key={p.uid} txt={fila.texto(p)} icono={fila.icono} />)}
            </tr>
          ))}
        </Tabla>
      )}

      {(resU || resP) && (
        <p className="mt-3 flex items-start gap-2 text-xs text-ink-faint">
          <ShieldCheck size={14} className="mt-0.5 shrink-0" />
          Datos oficiales en vivo: catálogo SNIES (datos.gov.co) y promedio Saber Pro del ICFES.
          La calidad Saber Pro se muestra por institución; empleabilidad (OLE) y permanencia (SPADIES) se añadirán con el backend.
        </p>
      )}
    </div>
  );
}

function Tabla({ cabeceras, children }: { cabeceras: { key: string; nombre: string }[]; children: ReactNode }) {
  return (
    <div className="mt-8 card overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-surface-border bg-surface-soft">
          <tr className="text-left">
            <th className="px-5 py-3 font-medium text-ink-soft">Atributo</th>
            {cabeceras.map((c) => <th key={c.key} className="px-4 py-3 font-semibold text-ink">{c.nombre}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border">{children}</tbody>
      </table>
    </div>
  );
}

function Celda({ txt, win, icono, saber }: { txt: string; win?: boolean; icono?: boolean; saber?: boolean }) {
  return (
    <td className={`px-4 py-3 font-semibold ${win ? "text-accent-green" : "text-ink"}`}>
      {icono && (txt.startsWith("Sí") || txt.startsWith("Alta")) ? (
        <span className="inline-flex items-center gap-1"><BadgeCheck size={14} className="text-accent-green" /> {txt}</span>
      ) : saber && txt !== "—" ? (
        <span className="inline-flex items-center gap-1"><GraduationCap size={14} className="text-brand-600" /> {txt}</span>
      ) : txt}
    </td>
  );
}
