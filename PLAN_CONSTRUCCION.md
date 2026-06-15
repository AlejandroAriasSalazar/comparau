# comparaU.com — Plan maestro de construcción

**Versión:** 1.0 · **Fecha:** 2026-06-14 · **Autor:** equipo comparaU

Este documento es el plan completo para construir y operar comparaU.com: el **backend** (API + datos) desplegado en un **VPS** y el **frontend** desplegado en **Vercel**. Está pensado para que un equipo pequeño pueda ejecutarlo de principio a fin, con decisiones técnicas justificadas, infraestructura reproducible y un cronograma por fases.

El contrato de la API (`openapi.yaml`) y su diseño detallado (`DISENO_API.md`) son insumos de este plan y la fuente de verdad del backend.

---

## 1. Visión y topología

comparaU.com permite a estudiantes y familias **comparar universidades y programas** de Colombia con datos exclusivamente oficiales: catálogo completo de IES y programas (SNIES), más indicadores de calidad (Saber Pro/ICFES), empleabilidad e ingreso de enganche (OLE) y permanencia (SPADIES).

La arquitectura separa responsabilidades en dos planos que se despliegan de forma independiente:

```
                       Internet
                          │
            ┌─────────────┴──────────────┐
            │                            │
   ┌────────▼─────────┐         ┌────────▼──────────┐
   │   VERCEL (Edge)  │         │     VPS (origen)  │
   │  Next.js front   │  HTTPS  │  Caddy → FastAPI  │
   │  SSR/ISR + CDN   │ ───────▶│  Postgres + Redis │
   │  comparau.com    │  /v1    │  api.comparau.com │
   └──────────────────┘         └─────────┬─────────┘
                                          │ (ETL programado)
                                ┌─────────▼─────────┐
                                │ Fuentes oficiales │
                                │ SNIES · datos.gov │
                                │ ICFES · OLE ·CNA  │
                                └───────────────────┘
```

El **frontend** vive en Vercel (despliegue por `git push`, CDN global, previews por PR). El **backend** vive en un VPS bajo Docker Compose, con HTTPS automático vía Caddy. El **ETL** corre dentro del VPS de forma programada y deja los datos listos en Postgres; la API solo lee.

Esta separación es deliberada: el frontend escala solo y gratis/barato en el borde, mientras el backend —que es estable y de bajo tráfico de escritura— se controla por completo en una máquina propia, sin sorpresas de facturación serverless ni límites de ejecución para el ETL.

---

## 2. Stack tecnológico (y por qué es el ideal para un VPS)

### 2.1 Backend — FastAPI sobre Docker Compose

| Componente | Elección | Por qué es ideal para un VPS |
|---|---|---|
| Lenguaje/framework | **Python 3.12 + FastAPI** | ETL de datos oficiales natural (pandas/httpx), validación con Pydantic v2, generación del OpenAPI alineada al contrato, enorme ecosistema |
| Servidor ASGI | **Uvicorn** (workers gestionados por Gunicorn) | Ligero; 2–4 workers saturan bien 2 vCPU |
| Base de datos | **PostgreSQL 16** | Integridad referencial programa→institución, `pg_trgm`+GIN para búsqueda sin un motor aparte |
| Caché | **Redis 7** | Cachea respuestas calculadas (`/comparar`) y rate limiting |
| Reverse proxy / TLS | **Caddy 2** | **HTTPS automático** (Let's Encrypt) sin configuración, compresión, headers de seguridad |
| Orquestación | **Docker Compose** | Todo el stack en un archivo; `docker compose up -d` y listo; reproducible |
| Migraciones | **Alembic** | Esquema versionado y reproducible |

**Por qué FastAPI y no Node/Go para *tu* VPS:** el trabajo más pesado del proyecto no es servir JSON (eso lo absorbe la caché), sino **ingerir y normalizar** datasets oficiales heterogéneos. Python con pandas hace eso en una fracción del código que Node o Go. FastAPI además es asíncrono y rápido sirviendo, y su footprint en RAM es modesto. Todo el stack corre cómodo en un VPS de **2 vCPU / 4 GB**, con holgura para crecer.

### 2.2 Frontend — Next.js en Vercel

| Componente | Elección | Razón |
|---|---|---|
| Framework | **Next.js 14 (App Router)** | SSR/ISR para SEO (clave en un comparador que se busca en Google), React Server Components, despliegue nativo en Vercel |
| Estilos | **Tailwind CSS** | Sistema de diseño utilitario, rápido y consistente |
| Componentes | **shadcn/ui** (Radix) | Accesibles, headless, estética SaaS limpia y personalizable |
| Gráficas | **Recharts** | Barras/radar para comparación de indicadores |
| Datos | **TanStack Query** + fetch nativo | Caché de cliente, revalidación, estados de carga |
| Tipos | **TypeScript** + tipos generados del OpenAPI | Contrato compartido front/back, cero *drift* |
| Hosting | **Vercel** | CDN global, ISR, previews por PR, analytics |

**Generación de tipos:** los tipos del cliente se generan desde `openapi.yaml` (`openapi-typescript`), de modo que si el backend cambia el contrato, el frontend deja de compilar — el error sale en CI, no en producción.

---

## 3. Modelo de datos y persistencia

El esquema relacional sigue el modelo del `DISENO_API.md`. Tablas principales: `instituciones`, `sedes`, `programas`, `acreditaciones`, `estadisticas_poblacionales`, `indicadores` y catálogos (`caracteres_academicos`, `areas_conocimiento`, `nbc`, `divipola_departamentos`, `divipola_municipios`). Una tabla `fuentes` registra cada sincronización (dataset, fecha de origen, filas, hash) y cada registro referencia su `fuente_id` para trazabilidad.

Decisiones de almacenamiento: claves primarias = `codigo_snies` (texto) por ser el identificador oficial; índices `pg_trgm` GIN sobre `nombre` para búsqueda difusa; índices compuestos para los filtros frecuentes (sector, carácter, departamento, nivel). Los datos se cargan como **snapshots versionados**: cada corrida del ETL escribe a una tabla de *staging*, valida, y promueve atómicamente; el `updated_at` del snapshot alimenta los `ETag`.

---

## 4. Pipeline de datos (ETL)

El ETL es el único camino de entrada de datos y corre como un servicio programado en el VPS (cron del contenedor o `systemd timer`). Cuatro fases, una por fuente y consolidación:

**Extracción.** Descarga vía la API SODA de datos.gov.co (`/resource/{id}.json` con paginación) para instituciones (`n5yy-8nav`), programas (`upr9-nkiz`) y Saber Pro (`u37r-hjmu`); descarga de las bases consolidadas del SNIES (poblacionales) y de los tableros/recursos del OLE y SPADIES. Cada descarga guarda el payload crudo con su fecha.

**Normalización.** Mapea nombres de columna del origen a los campos del modelo, convierte centinelas (`"NA"`, `"NO INFORMA"`, `"No disponible"`) a `null`, normaliza geografía contra DIVIPOLA, deduplica seccionales y tipa fechas/enteros. Las reglas viven en `etl/normalize.py` y están cubiertas por pruebas.

**Validación.** Verifica unicidad de claves SNIES, integridad referencial programa→institución, dominios de enums y rangos de fechas. Lo que no valida va a una tabla de **cuarentena** con su causa; nunca contamina el snapshot servido.

**Carga.** Inserta en *staging*, calcula hash por tabla, y promueve a producción solo si cambió. Sella cada registro con `fuente` y dispara la invalidación de caché (purga de Redis + cambio de `ETag`).

Frecuencia: catálogos e indicadores **anual/semestral** (la cadencia oficial); el ETL es idempotente, así que puede correrse a demanda sin efectos secundarios.

---

## 5. Infraestructura del VPS

### 5.1 Dimensionamiento y SO

VPS recomendado: **2 vCPU, 4 GB RAM, 80 GB SSD**, Ubuntu 22.04/24.04 LTS (DigitalOcean, Hetzner, Vultr o similar). Hetzner CX22 (~€4–6/mes) sobra para empezar. Todo corre en Docker, así que el SO solo necesita Docker Engine + Compose.

### 5.2 Provisioning (resumen reproducible)

1. Crear el droplet/servidor con clave SSH (deshabilitar password).
2. `ufw`: permitir solo 22, 80, 443. `fail2ban` para SSH.
3. Instalar Docker Engine + Compose plugin.
4. Crear usuario `deploy` no-root; clonar el repo en `/opt/comparau`.
5. Copiar `.env` (secretos) — nunca al repo.
6. `docker compose up -d`. Caddy obtiene el certificado TLS automáticamente para `api.comparau.com` (apuntar el DNS A-record al VPS antes).
7. Programar el ETL (`docker compose run --rm etl` vía `systemd timer` o cron).

### 5.3 Servicios (docker-compose)

`caddy` (80/443, TLS auto, reverse proxy a la API) · `api` (FastAPI/Uvicorn) · `db` (Postgres, volumen persistente) · `redis` (caché) · `etl` (perfil `tools`, se ejecuta on-demand). Healthchecks en `api` y `db`; reinicio `unless-stopped`.

### 5.4 Operación

- **Backups**: `pg_dump` diario a almacenamiento externo (S3/Backblaze) + snapshot del proveedor. Probar restauración mensual.
- **Logs/observabilidad**: logs estructurados a stdout (capturados por Docker); opcional Grafana+Loki o Uptime Kuma para *uptime*. `/health` monitoreado externamente.
- **Actualizaciones**: `git pull && docker compose up -d --build`. Imágenes con tag por versión.
- **Seguridad**: secretos en `.env` (chmod 600), Postgres no expuesto a Internet (solo red interna de Compose), Caddy añade HSTS y headers.

---

## 6. Despliegue del frontend (Vercel)

Repo `frontend/` conectado a Vercel. Cada `git push` a `main` despliega a producción; cada PR genera una *preview URL*. Variable de entorno `NEXT_PUBLIC_API_BASE_URL=https://api.comparau.com/v1`. Estrategia de render: **ISR** para páginas de instituciones/programas (se regeneran cada N horas, óptimas para SEO y velocidad) y render dinámico para `/comparar` y `/buscar`. Dominio `comparau.com` gestionado en Vercel; `api.comparau.com` apunta al VPS.

CORS: la API permite el origen `https://comparau.com` y los dominios de preview de Vercel. Rate limiting por API key del frontend.

---

## 7. CI/CD

**Backend** (GitHub Actions): lint (ruff) + tipos (mypy) + pruebas (pytest) + validación del OpenAPI (Spectral) + build de imagen Docker. En *merge* a `main`, despliegue por SSH al VPS (`docker compose pull && up -d`) o vía *self-hosted runner*.

**Frontend** (Vercel + Actions): lint (eslint) + typecheck (tsc) + build. Vercel despliega automáticamente; Actions corre las pruebas y la generación de tipos desde el OpenAPI para detectar *drift* de contrato.

---

## 8. Seguridad, privacidad y cumplimiento

No se exponen datos personales: los microdatos de Saber Pro se ingieren **anonimizados** y solo se publican **agregados** (promedios por institución/programa), nunca registros individuales. La API es de solo lectura y autenticada por API key (público) u OAuth2 (cuotas ampliadas). TLS en todo, HSTS, rate limiting, validación estricta de entradas (defensa ante inyección). Cumplimiento de la licencia **CC BY-SA 4.0** de los datos: atribución visible en el footer y en cada bloque `fuente`. Aviso de privacidad y términos en el sitio.

---

## 9. Costos estimados (mensual, etapa inicial)

| Concepto | Proveedor | Costo aprox. |
|---|---|---|
| VPS 2 vCPU/4 GB | Hetzner/DigitalOcean | €5–12 |
| Backups objeto | Backblaze B2/S3 | €1–3 |
| Frontend | Vercel Hobby/Pro | €0–20 |
| Dominio comparau.com | Registrador | ~€12/año |
| **Total** | | **≈ €6–35/mes** |

El diseño *read-optimized* + CDN mantiene el costo plano aunque el tráfico crezca, porque la mayoría de respuestas se sirven desde el borde.

---

## 10. Cronograma por fases

**Fase 0 — Cimientos (semana 1).** Repos (monorepo o dos repos), CI básico, contrato OpenAPI congelado, esqueleto FastAPI + Next.js corriendo en local con Docker. *Entregable:* `docker compose up` levanta API vacía con `/health` y la landing en local.

**Fase 1 — Datos (semanas 2–3).** ETL de instituciones y programas (las dos fuentes base), modelo Postgres + migraciones, endpoints de catálogo, listado y detalle. *Entregable:* `/instituciones` y `/programas` sirviendo datos reales.

**Fase 2 — Indicadores y comparación (semanas 3–4).** ETL de Saber Pro, OLE y SPADIES; entidad `indicadores`; endpoints `/.../indicadores` y `/comparar`. *Entregable:* comparación lado a lado con datos reales.

**Fase 3 — Frontend (semanas 4–6).** Landing, búsqueda con filtros, ficha de institución/programa, comparador visual (tablas + radar), SEO/ISR. *Entregable:* comparau.com navegable en Vercel contra la API del VPS.

**Fase 4 — Endurecimiento y lanzamiento (semana 7).** Backups, monitoreo, rate limiting, pruebas de carga, accesibilidad (WCAG AA), analítica, términos/privacidad. *Entregable:* producción estable.

**Fase 5 — Evolución.** Descripciones de programa (registro calificado), dominio de docentes, estadísticas agregadas para tableros, alertas de actualización de fuentes.

---

## 11. Estructura del repositorio (entregada)

```
comparau/
├── PLAN_CONSTRUCCION.md      ← este documento
├── openapi.yaml              ← contrato (fuente de verdad)
├── DISENO_API.md             ← diseño detallado de la API
├── backend/                  ← FastAPI + Docker (va al VPS)
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── Caddyfile
│   ├── requirements.txt
│   ├── .env.example
│   ├── app/                  ← API (config, db, modelos, schemas, endpoints, servicios)
│   └── etl/                  ← pipeline de ingesta de fuentes oficiales
└── frontend/                 ← Next.js + Tailwind + shadcn (va a Vercel)
    ├── package.json
    ├── next.config.mjs
    ├── tailwind.config.ts
    ├── app/                  ← landing, buscar, comparar, ficha
    ├── components/           ← UI y bloques
    └── lib/                  ← cliente API y tipos
```

Los apartados `backend/` y `frontend/` se entregan ya con su esqueleto de código funcional para arrancar las Fases 0–1. Cada uno trae su propio `README.md` con instrucciones de ejecución local y despliegue.

---

*Insumos: `openapi.yaml` (contrato) y `DISENO_API.md` (diseño). Datos de origen bajo CC BY-SA 4.0 (datos.gov.co / MEN / ICFES). El backend se despliega en VPS; el frontend en Vercel.*
