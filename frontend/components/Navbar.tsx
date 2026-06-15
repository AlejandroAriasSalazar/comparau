import Link from "next/link";
import { GraduationCap } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-surface-border/70 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-ink">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-lift">
            <GraduationCap size={20} />
          </span>
          compara<span className="text-brand-600">U</span>
        </Link>
        <div className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
          <Link href="/buscar" className="hover:text-brand-700">Buscar</Link>
          <Link href="/comparar" className="hover:text-brand-700">Comparar</Link>
          <Link href="/#fuentes" className="hover:text-brand-700">Fuentes</Link>
          <Link href="/#como" className="hover:text-brand-700">Cómo funciona</Link>
        </div>
        <Link href="/comparar" className="btn-primary !px-4 !py-2 text-sm">Comparar ahora</Link>
      </nav>
    </header>
  );
}
