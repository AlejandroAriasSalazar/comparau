import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-surface-border bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <div className="font-bold text-ink">compara<span className="text-brand-600">U</span></div>
            <p className="mt-2 text-sm text-ink-soft">
              Compara universidades y programas de Colombia con datos oficiales y verificables.
            </p>
          </div>
          <div>
            <div className="text-sm font-semibold text-ink">Producto</div>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li><Link href="/buscar" className="hover:text-brand-700">Buscar</Link></li>
              <li><Link href="/comparar" className="hover:text-brand-700">Comparar</Link></li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-ink">Fuentes oficiales</div>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li>SNIES — MEN</li>
              <li>ICFES — Saber Pro</li>
              <li>OLE — Observatorio Laboral</li>
              <li>SPADIES · CNA</li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold text-ink">Legal</div>
            <ul className="mt-3 space-y-2 text-sm text-ink-soft">
              <li><Link href="/terminos" className="hover:text-brand-700">Términos</Link></li>
              <li><Link href="/privacidad" className="hover:text-brand-700">Privacidad</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-surface-border pt-6 text-xs text-ink-faint">
          Datos bajo licencia Creative Commons BY-SA 4.0 (datos.gov.co / Ministerio de Educación
          Nacional / ICFES). comparaU no produce rankings propios: cada indicador se presenta con su
          año y fuente. © {new Date().getFullYear()} comparaU.com
        </div>
      </div>
    </footer>
  );
}
