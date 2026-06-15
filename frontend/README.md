# comparaU.com — Frontend (Next.js, para Vercel)

Interfaz estilo SaaS limpio para comparar universidades y programas de Colombia. Next.js 14 (App Router) + Tailwind + Recharts, desplegable en Vercel con `git push`.

## Ejecución local

```bash
npm install
cp .env.example .env.local         # apunta a tu API (VPS o local)
npm run dev                        # http://localhost:3000
```

## Páginas

- `/` — landing (hero, indicadores, comparación, fuentes, CTA).
- `/buscar` — búsqueda de IES con filtros (sector, carácter académico), en vivo contra la API.
- `/comparar` — comparador: añade 2–5 universidades y obtén la matriz de indicadores con advertencias.
- `/instituciones/[codigo]` — ficha de institución con sus programas (ISR para SEO).

## Diseño

Sistema en `tailwind.config.ts` (paleta `brand` azul académico, `ink`, `surface`) y utilidades en `globals.css` (`.card`, `.btn-primary`, `.chip`, fondo `hero-bg`/`grid-bg`). Iconografía: lucide-react. Tipografía: Inter.

## Datos y tipos

`lib/api.ts` es el cliente de la API (`NEXT_PUBLIC_API_BASE_URL`). Los tipos están en `lib/types.ts`; en producción se generan del contrato con `npm run gen:types` (openapi-typescript sobre `../openapi.yaml`), de modo que un cambio del backend que rompa el contrato falla en CI.

## Despliegue en Vercel

1. Importar el repo en Vercel (raíz del proyecto = `frontend/`).
2. Env var: `NEXT_PUBLIC_API_BASE_URL=https://api.comparau.com/v1`.
3. Dominio `comparau.com` en Vercel. La API vive en el VPS (`api.comparau.com`).
4. Cada `git push` a `main` despliega; cada PR genera una preview.

> Render: ISR (revalidate 1h) en fichas de institución/programa para SEO y velocidad; render dinámico en `/buscar` y `/comparar`.
