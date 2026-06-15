# comparaU.com — Backend (FastAPI + Docker, para VPS)

API de solo lectura sobre datos oficiales de la educación superior de Colombia. Pensada para correr en un VPS modesto (2 vCPU / 4 GB) con Docker Compose y HTTPS automático vía Caddy.

## Stack

FastAPI · PostgreSQL 16 · Redis 7 · Caddy 2 (TLS auto) · Gunicorn/Uvicorn · SQLAlchemy 2 · Alembic. ETL en Python (httpx + pandas).

## Ejecución local

```bash
cp .env.example .env          # edita las claves
docker compose up -d --build  # levanta caddy, api, db, redis
docker compose run --rm etl   # carga datos oficiales (instituciones + programas)
```

API local: la documentación interactiva queda en `http://localhost:8000/docs` (en local, sin Caddy, exponé el puerto 8000 del servicio `api`). En el VPS, Caddy publica `https://api.comparau.com`.

## Estructura

```
backend/
├── docker-compose.yml   # caddy + api + db + redis + etl(on-demand)
├── Dockerfile           # imagen ligera, usuario no-root
├── Caddyfile            # HTTPS automático + headers de seguridad
├── requirements.txt
├── .env.example
├── app/
│   ├── main.py          # FastAPI app (CORS, gzip, router /v1)
│   ├── core/config.py   # settings 12-factor
│   ├── db/session.py    # engine + Session
│   ├── models/          # ORM: Institucion, Programa, Indicador, Fuente
│   ├── schemas/         # Pydantic (respuestas + RFC 9457)
│   ├── api/v1/          # router + endpoints
│   └── services/        # lógica de /comparar
└── etl/
    ├── sources.py       # fuentes oficiales + mapeo de columnas (real)
    ├── normalize.py     # centinelas→null, tipado, bool
    └── ingest.py        # extracción SODA paginada → Postgres (idempotente)
```

## Endpoints (Fase 0–2 implementados)

- `GET /v1/health`
- `GET /v1/instituciones` (filtros: q, sector, caracter_academico, departamento, acreditada_alta_calidad)
- `GET /v1/instituciones/{codigo}`
- `GET /v1/programas` (filtros: q, codigo_institucion, nivel_academico, nbc, metodologia, estado)
- `GET /v1/programas/{codigo}`
- `GET /v1/comparar?tipo=&ids=&indicadores=&anio=`

El contrato completo (incluye indicadores, acreditaciones, catálogos y estadísticas para fases posteriores) está en `../openapi.yaml`.

## Despliegue en el VPS (resumen)

1. DNS: `A api.comparau.com → IP_DEL_VPS`.
2. `ufw allow 22,80,443` · `fail2ban` · Docker Engine + Compose.
3. `git clone` en `/opt/comparau`, `cp .env.example .env` y completar secretos.
4. Editar dominio/email en `Caddyfile`.
5. `docker compose up -d --build` (Caddy obtiene el certificado solo).
6. `docker compose run --rm etl` y programar con `systemd timer`/cron.
7. Backups: `pg_dump` diario a almacenamiento externo.

> Postgres no expone puertos a Internet (solo la red interna de Compose). Secretos solo en `.env` (chmod 600), nunca en el repo.
