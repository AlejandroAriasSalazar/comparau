import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-32 text-center">
      <div className="text-6xl font-extrabold text-brand-600">404</div>
      <p className="mt-4 text-ink-soft">No encontramos lo que buscabas.</p>
      <Link href="/" className="btn-primary mt-8">Volver al inicio</Link>
    </div>
  );
}
