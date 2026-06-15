# comparaU.com — Diseño de la API de comparación de Educación Superior de Colombia

**Versión del documento:** 1.1 · **Fecha:** 2026-06-14 · **Contrato:** `openapi.yaml` (OpenAPI 3.1, validado) · **API v1.1.0**

Este documento describe el diseño técnico de la API REST de solo lectura que potencia a **comparaU.com**: una plataforma para **comparar universidades y programas** de Colombia con datos exclusivamente oficiales. La API publica el 100% de las Instituciones de Educación Superior (IES) registradas en el SNIES y su oferta académica de pregrado y posgrado, y añade los **indicadores oficiales de resultado** —calidad, empleabilidad y permanencia— que hacen posible una comparación honesta. El diseño está anclado en los esquemas reales de las fuentes oficiales, de modo que cada campo del modelo corresponde a un campo publicado por el Estado colombiano.

> **Cambios v1.1 (rebranding comparaU.com):** nuevo dominio `api.comparau.com`; tres fuentes oficiales nuevas (ICFES Saber Pro, OLE, SPADIES); entidad `Indicador`; endpoints `/instituciones/{id}/indicadores`, `/programas/{id}/indicadores` y `/comparar`; y la nueva **Sección 11 — Arquitectura técnica y mejores prácticas de construcción**.

## 1. Alcance y decisiones de producto

El alcance acordado cubre **todas las IES** del sistema, no solo las universidades. En Colombia "Universidad" es uno de cuatro caracteres académicos; el sistema incluye además instituciones universitarias / escuelas tecnológicas, instituciones tecnológicas e instituciones técnicas profesionales. El dataset oficial de instituciones contiene 361 registros (300 sedes principales y 61 seccionales), de los cuales 245 son del sector privado y 116 del sector oficial, y 107 cuentan con acreditación institucional de alta calidad. La API expone estas cuatro categorías de forma homogénea.

Se excluyen deliberadamente dos cosas que el usuario mencionó pero que **no son verificables desde fuente oficial**: los contactos de los jefes de programa (no existen en ningún dataset gubernamental centralizado; viven dispersos en los sitios de cada institución) y los costos de matrícula (no se publican de forma estructurada). Incluir esos campos con datos inventados o scrapeados de calidad heterogénea rompería la promesa central del proyecto: que todo dato sea real y verificable. El modelo de datos sí conserva, donde corresponde, campos opcionales para no cerrar la puerta a una futura carga curada, pero en la versión 1.0 se entregan como `null` con su estado de disponibilidad documentado.

Una nota importante sobre las **descripciones de programa**: el SNIES abierto tampoco las publica. El catálogo de programas trae nombre, título otorgado, NBC, área, nivel, metodología, créditos, periodicidad, registro calificado y acreditación, pero no un texto descriptivo. El diseño modela el campo `descripcion` y deja explícito, vía el objeto `disponibilidad`, que la fuente no lo provee; la única ruta oficial para poblarlo sería extraerlo de los documentos de registro calificado del MEN, lo cual se documenta como trabajo futuro y no como dato garantizado de la v1.

## 2. Fuentes de datos (única autoridad)

| Fuente | Autoridad | Uso en la API | Identificador / enlace |
|---|---|---|---|
| SNIES — Sistema Nacional de Información de la Educación Superior | Ministerio de Educación Nacional | Autoridad maestra de IES y programas | snies.mineducacion.gov.co |
| MEN_INSTITUCIONES EDUCACIÓN SUPERIOR (datos.gov.co) | MEN | Entidad `Institución` | `n5yy-8nav` |
| MEN_PROGRAMAS_DE_EDUCACIÓN_SUPERIOR (datos.gov.co) | MEN | Entidad `Programa` | `upr9-nkiz` |
| Resultados únicos Saber Pro (datos.gov.co) | ICFES | Indicador de **calidad** por institución/programa | `u37r-hjmu` |
| OLE — Observatorio Laboral para la Educación | MEN | Indicador de **empleabilidad** (tasa de vinculación) e **ingreso de enganche** | ole.mineducacion.gov.co |
| SPADIES (subsistema del SNIES) | MEN | Indicador de **deserción / permanencia / graduación** | mineducacion.gov.co/sistemasinfo/spadies |
| Bases poblacionales consolidadas SNIES | MEN | Estadísticas de matriculados, admitidos, graduados | snies.mineducacion.gov.co/portal/ESTADISTICAS |
| CNA — Consejo Nacional de Acreditación | CESU / MEN | Acreditaciones de alta calidad y vigencias | cna.gov.co |
| DIVIPOLA | DANE | Normalización geográfica (departamento/municipio) | dane.gov.co |

Los indicadores de resultado son lo que distingue a comparaU de un simple directorio. **Saber Pro** (ICFES) mide la calidad de los aprendizajes de los estudiantes próximos a graduarse; su dataset abierto (`u37r-hjmu`) contiene resultados anonimizados con la institución y el programa, agregables a promedios comparables. El **OLE** publica, a partir del cruce con la Planilla Integrada de Liquidación de Aportes (PILA), la tasa de vinculación al mercado laboral formal y el Ingreso Base de Cotización (IBC) mediano de los recién graduados —el "salario de enganche"— por nivel de formación, NBC e institución. **SPADIES** entrega la deserción (anual y por cohorte), la permanencia y la tasa de graduación. Juntas, estas tres fuentes responden las tres preguntas reales de quien compara: ¿se aprende?, ¿se consigue empleo y cuánto se gana?, ¿se logra terminar?

La licencia de los datasets de datos.gov.co es **Creative Commons BY-SA 4.0**, lo que permite redistribuir con atribución y bajo la misma licencia. La API hereda esa obligación: el documento de términos y el bloque `fuente` de cada registro garantizan la atribución.

## 3. Principios de arquitectura

El diseño sigue cinco principios no negociables.

**Solo lectura.** La API no expone escrituras públicas. Los datos provienen de fuentes oficiales y la única forma de modificarlos es a través del pipeline de ingesta interno, que sincroniza contra el origen. Esto elimina por completo superficies de ataque de escritura y simplifica el modelo de seguridad y de caché.

**Trazabilidad total.** Cada recurso —institución, programa, acreditación, estadística— incluye un objeto `fuente` con el sistema, el dataset, su identificador, la URL, la licencia y la fecha de actualización en el origen. Un consumidor puede tomar cualquier registro y verificarlo contra el portal oficial sin intermediarios. Donde existe un acto administrativo (norma de creación, resolución de acreditación, registro calificado), se expone su número y entidad emisora, que es el ancla de verificación legal.

**Honestidad sobre los datos.** La API distingue entre "no aplica", "la fuente no informa" y "la fuente no publica este campo" mediante el objeto `disponibilidad`. Nunca se rellena un hueco con un valor plausible. Un `null` siempre es explicable.

**Contrato estable y versionado.** El versionado es por URI (`/v1`). Los cambios retrocompatibles (nuevos campos opcionales, nuevos endpoints) no incrementan la versión mayor; los cambios incompatibles exigen `/v2` con periodo de convivencia y política de deprecación anunciada por la cabecera `Sunset`.

**Estándares de industria.** Paginación por cursor, errores RFC 9457 (Problem Details), caché condicional con `ETag`/`Last-Modified`, rate limiting con cabeceras del borrador IETF, content negotiation JSON/CSV y selección parcial de campos.

## 4. Modelo de datos

El modelo gira en torno a cuatro entidades principales y un conjunto de catálogos de referencia.

**Institución (IES)** es la entidad raíz, identificada por su `codigo_snies`. Reúne los atributos administrativos (nombre, NIT, sigla, sector, carácter académico, naturaleza jurídica, principal/seccional, norma de creación, estado, sitio web, teléfono), su domicilio normalizado a DIVIPOLA y un bloque embebido de acreditación institucional con resolución, fecha y vigencia. Estos campos provienen uno a uno del dataset `n5yy-8nav`.

**Sede** representa la sede principal o las seccionales de una institución. En el dataset abierto las seccionales aparecen como filas adicionales de la misma institución diferenciadas por `Principal/Seccional`; el diseño las normaliza en un recurso propio accesible por `/instituciones/{codigo}/sedes`.

**Programa** es la unidad de oferta académica, identificada por su propio `codigo_snies`. Modela título otorgado, nivel académico (pregrado/posgrado), nivel de formación (técnica profesional, tecnológica, universitaria, especialización, maestría, doctorado), área de conocimiento, núcleo básico del conocimiento (NBC), metodología, créditos, periodicidad, número de periodos, municipio de oferta, estado, fecha de creación, registro calificado y acreditación de programa. Estos campos provienen del dataset `upr9-nkiz`.

**Acreditación** se expone tanto embebida (dentro de institución y de programa) como recurso de primer nivel consultable y filtrable, alimentado por la información del CNA. Distingue el tipo (institucional o de programa), su resolución, fecha, vigencia y si está vigente a la fecha.

**Estadística poblacional** asocia a cada institución series por año y periodo de inscritos, admitidos, matriculados y graduados. El campo `matriculados` es el proxy oficial de "número de estudiantes", la métrica que el usuario solicitó; proviene de las bases poblacionales consolidadas del SNIES, separadas de los datasets de catálogo.

**Indicador** es una entidad transversal y atómica que representa un único dato de resultado oficial: un promedio Saber Pro, una tasa de vinculación laboral, un ingreso mediano de enganche, una tasa de deserción. Cada indicador es independiente y trae su `clave`, `dominio` (calidad/empleabilidad/permanencia), `valor`, `unidad`, `anio`, `grano` (institución, programa, NBC, área o nacional) y su `fuente`. Los indicadores se exponen por institución (`/instituciones/{id}/indicadores`) y por programa (`/programas/{id}/indicadores`), y son la materia prima de la **Comparación**: el endpoint `/comparar` los organiza en una matriz entidad × indicador con advertencias de comparabilidad. El diseño deliberadamente *no* fusiona indicadores en un puntaje único (ver Sección 11.10).

Los **catálogos** (caracteres académicos, áreas de conocimiento, NBC, niveles de formación, metodologías, departamentos y municipios DIVIPOLA) se exponen como endpoints de referencia para que los clientes construyan filtros sin adivinar valores.

## 5. Diccionario de datos (campos principales → origen)

### Institución (origen: `n5yy-8nav`)

| Campo API | Campo fuente | Tipo | Notas |
|---|---|---|---|
| `codigo_snies` | `Código Institución` | string | Clave primaria SNIES |
| `nombre` | `Nombre Institución` | string | |
| `nit` | `Número Identificación Tributaria - NIT` | string\|null | `"NO INFORMA"` → `null` |
| `principal_seccional` | `Principal/Seccional` | enum | Principal · Seccional |
| `naturaleza_juridica` | `Naturaleza Jurídica` | enum | Fundación, Corporación, Nacional, Departamental, Municipal |
| `sector` | `Sector` | enum | Oficial · Privado |
| `caracter_academico` | `Carácter Académico` | enum | 4 categorías oficiales |
| `domicilio.departamento` | `Departamento Domicilio` | string | + `Cod Departamento` DIVIPOLA |
| `domicilio.municipio` | `Municipio Domicilio` | string | + `Cod Municipio` DIVIPOLA |
| `domicilio.direccion` | `Dirección Domicilio` | string\|null | |
| `telefono` | `Teléfono Domicilio` | string\|null | `"NA"` → `null` |
| `norma_creacion` | `Norma de Creación` + `Fecha Norma de Creación` | objeto | Se parsea tipo/número/entidad |
| `acreditacion_institucional.acreditada` | `¿Acreditada Alta Calidad?` | boolean | `SI/NO` → `true/false` |
| `acreditacion_institucional.fecha` | `Fecha Acreditación` | date\|null | |
| `acreditacion_institucional.resolucion` | `Resolución de la acreditación` | string\|null | |
| `acreditacion_institucional.vigencia_anios` | `Vigencia de la acreditación` | int\|null | |
| `estado` | `Estado` | enum | |
| `sitio_web` | `Página Web` | uri\|null | Se normaliza esquema/host |
| `fuente.fecha_actualizacion` | `Fecha Actualizacion` | date | |

### Programa (origen: `upr9-nkiz`)

| Campo API | Campo fuente | Tipo |
|---|---|---|
| `codigo_snies` | `codigoprograma` | string |
| `nombre` | `nombreprograma` | string |
| `codigo_institucion` | `codigoinstitucion` | string |
| `titulo_otorgado` | `nombretituloobtenido` | string\|null |
| `nivel_academico` | `nombrenivelacademico` | enum |
| `nivel_formacion` | `nombrenivelformacion` | enum |
| `area_conocimiento` | `codigoareaconocimiento` / `nombreareaconocimiento` | objeto |
| `nucleo_basico_conocimiento` | `codigonbc` / `nombrenbc` | objeto |
| `metodologia` | `nombremetodologia` | enum |
| `creditos` | `cantidadcreditos` | int\|null |
| `periodicidad` | `nombreperiodicidad` | string\|null |
| `numero_periodos` | `cantidadperiodos` | int\|null |
| `municipio_oferta` | `codigomunicipioprograma` / `nombremunicipioprograma` | objeto |
| `estado` | `nombreestadoprograma` | enum |
| `fecha_creacion` | `fechacreacion` | date\|null |
| `registro_calificado` / `acreditacion` | `codigotipoacreditacion`, `numeroresolucionacreditacion`, `fechaacreditacion`, `aniosacreditados` | objeto |
| `descripcion` | — (no publicado por la fuente) | null |

## 6. Diseño de la interfaz (endpoints)

La API ofrece 18 operaciones agrupadas en seis dominios. El recurso de instituciones soporta listado con filtros por sector, carácter académico, naturaleza jurídica, departamento, municipio, acreditación y estado, además de búsqueda de texto y sub-recursos para sedes, programas, acreditaciones y estadísticas. El recurso de programas permite filtrado global por institución, nivel académico, nivel de formación, área, NBC, metodología, geografía, estado y acreditación. Las acreditaciones y los catálogos completan la superficie de consulta, y el dominio de metadatos expone la procedencia de las fuentes y la salud del servicio. El detalle exacto de parámetros, esquemas y códigos de respuesta vive en `openapi.yaml`, que es la fuente de verdad del contrato.

## 7. Convenciones transversales

**Paginación.** Por cursor opaco (`cursor` + `limit`, máximo 200). El cursor evita los problemas de consistencia del offset en datasets grandes y se devuelve en `meta.paginacion.siguiente`. La respuesta incluye `total` para clientes que necesiten dimensionar.

**Filtrado, orden y campos.** Los filtros son parámetros de query tipados contra los enums oficiales, lo que permite rechazar valores inválidos con un 422 explicativo. El ordenamiento usa `sort` con prefijo `-` para descendente. La selección parcial usa `fields` (sparse fieldsets) para minimizar payload.

**Errores.** Todos los errores siguen RFC 9457 con `application/problem+json`, incluyendo `type`, `title`, `status`, `detail`, `instance` y una lista `errors` por campo para fallos de validación.

**Caché.** Como los datos cambian con frecuencia anual, las respuestas llevan `Cache-Control: public, max-age=86400`, `ETag` y `Last-Modified`. Las peticiones condicionales (`If-None-Match`) devuelven `304`.

**Rate limiting.** Cabecera `RateLimit` con límite, restante y reinicio; `429` con `Retry-After` al exceder la cuota.

**Formatos.** Negociación de contenido entre `application/json` (por defecto) y `text/csv` para exportación masiva en los listados de instituciones y programas.

## 8. Seguridad

La API es pública pero autenticada para control de cuotas y abuso. El esquema base es **API Key** por cabecera `X-API-Key` para el plan de solo lectura, y **OAuth 2.0 client credentials** con scopes (`read:instituciones`, `read:programas`, `read:estadisticas`) para integraciones con cuotas ampliadas. Toda la comunicación es sobre TLS. Al no haber escrituras públicas ni datos personales sensibles (los datos son institucionales y de oferta, ya públicos por mandato legal), la superficie de riesgo se concentra en disponibilidad y abuso, mitigados con rate limiting, caché agresiva y CDN.

## 9. Gobernanza de datos e ingesta (ETL)

El pipeline de ingesta es el único camino por el que entran datos. Corre de forma programada (frecuencia oficial de actualización: anual para los catálogos, semestral para las bases poblacionales) y ejecuta cuatro fases. **Extracción** desde las APIs SODA de datos.gov.co (`/resource/{id}.json`) y las bases consolidadas del SNIES y del CNA. **Normalización**, que mapea nombres de columna del origen a los campos del modelo, convierte centinelas (`"NA"`, `"NO INFORMA"`, `"No disponible"`) a `null`, normaliza geografía contra DIVIPOLA y deduplica seccionales. **Validación**, que verifica unicidad de claves SNIES, integridad referencial programa→institución, rangos de fechas y dominios de enums; cualquier registro que no valide se aísla en una cola de cuarentena con su causa, sin contaminar el catálogo servido. **Carga versionada**, que publica un nuevo snapshot inmutable y sella cada registro con su `fuente.fecha_actualizacion`, de modo que el `ETag` del recurso cambia solo cuando cambió el dato de origen.

La calidad de los datos abiertos colombianos es desigual (hay direcciones con caracteres corruptos, fechas fuera de rango y NIT ausentes); por eso la honestidad sobre disponibilidad es parte del diseño y no un añadido. La API nunca presenta como cierto lo que la fuente marcó como desconocido.

## 10. Trabajo futuro

Tres extensiones quedan documentadas como evolución, no como promesa de la v1: incorporar las descripciones de programa desde los documentos de registro calificado del MEN cuando estén disponibles de forma estructurada; añadir un dominio de docentes a partir de las bases de personal del SNIES; y exponer un endpoint de estadísticas agregadas (conteos por departamento, área y nivel) para tableros, calculado sobre los snapshots versionados.

## 11. Arquitectura técnica y mejores prácticas de construcción

Esta sección justifica, decisión por decisión, por qué la API está construida como está. El criterio rector es que para un catálogo nacional de solo lectura, con actualización periódica y altísima proporción de lecturas, la mejor técnica no es la más sofisticada sino la que maximiza correctitud, velocidad y cacheabilidad con la menor superficie operativa.

### 11.1 Contract-first (diseño guiado por el contrato)

El `openapi.yaml` no es documentación generada después del código: es el **artefacto fuente**. De él se derivan el servidor (stubs/validadores), los SDK de cliente, los mocks para el frontend de comparaU y las pruebas de contrato. Esto desacopla el equipo de frontend del de backend desde el día uno (pueden trabajar contra un mock fiel) y convierte cualquier ruptura del contrato en un fallo de CI, no en un incidente de producción. El spec se somete a *linting* con reglas de estilo (p. ej. Spectral) en cada commit para forzar consistencia de nombres, ejemplos y respuestas de error.

### 11.2 Por qué REST y no GraphQL (ni gRPC)

Se eligió **REST sobre HTTP/JSON** porque el factor dominante de rendimiento aquí es la **caché HTTP**: datos casi inmutables entre sincronizaciones, consultas muy repetidas (las mismas universidades populares una y otra vez) y recursos identificables por URL. REST permite cachear cada recurso en CDN con `ETag` y `max-age`, algo que GraphQL —con su único endpoint `POST` y cuerpos de consulta variables— complica notablemente. GraphQL brillaría si los clientes necesitaran grafos profundos y a medida; aquí el acceso es tabular y predecible, y el sobre-/sub-fetching se resuelve más barato con *sparse fieldsets* (`fields=`) y expansión selectiva. gRPC se descartó por ser un API público de cara a navegadores y terceros, donde la interoperabilidad HTTP/JSON y la cacheabilidad pesan más que la latencia binaria. La consecuencia práctica: la mayoría de respuestas se sirven desde el borde (CDN) sin tocar el origen.

### 11.3 Modelo de despliegue: pre-cómputo sobre datos de lectura

Como los datos cambian de forma **discreta y programada** (no transaccional), la arquitectura óptima es de tipo *read-optimized*: el pipeline de ingesta (Sección 9) produce **snapshots inmutables y versionados**, y la API sirve siempre el snapshot vigente. Esto habilita tres cosas: respuestas deterministas (mismo `ETag` ⇒ misma representación), invalidación de caché trivial (cambia el snapshot ⇒ cambian los `ETag`) y la posibilidad de servir buena parte del tráfico como contenido estático/casi-estático desde CDN. El almacén primario es una base relacional (PostgreSQL) por su integridad referencial programa→institución y sus restricciones de dominio; la búsqueda de texto y los filtros facetados se delegan a un índice invertido (OpenSearch/Elasticsearch o `pg_trgm` + GIN para una escala como esta), poblado desde el mismo snapshot.

### 11.4 Caché en capas y peticiones condicionales

Tres capas: CDN en el borde, caché de aplicación (Redis) para respuestas calculadas como `/comparar`, y caché de cliente vía cabeceras. Cada recurso emite `ETag` (hash del contenido del snapshot) y `Cache-Control: public, max-age=86400`; los clientes revalidan con `If-None-Match` y reciben `304 Not Modified` cuando nada cambió, ahorrando ancho de banda y origen. La comparación, al ser una composición determinista de recursos cacheados, también es cacheable por su combinación de parámetros normalizados.

### 11.5 Paginación por cursor (no por offset)

Para colecciones grandes (decenas de miles de programas) la paginación por **cursor opaco** evita los dos defectos del offset: el coste creciente de `OFFSET n` en la base y los saltos/duplicados cuando los datos cambian entre páginas. El cursor codifica la posición estable de orden, de modo que recorrer todo el catálogo es O(n) y consistente dentro de un snapshot.

### 11.6 Diseño de errores, validación y entradas

Todos los errores siguen **RFC 9457 (Problem Details)** con `application/problem+json`, un `type` accionable y una lista `errors` por campo. La validación es estricta y temprana: los filtros se tipan contra los enums oficiales (un `sector=xyz` se rechaza con 422 antes de tocar la base), lo que también es una defensa contra inyección y *fuzzing*. La regla es *fail fast* con mensajes que enseñan al integrador qué valor era válido.

### 11.7 Versionado y evolución sin romper

Versionado por URI (`/v1`) para cambios incompatibles, combinado con **evolución aditiva** dentro de la versión: nuevos campos opcionales y nuevos endpoints no rompen clientes. Cuando llegue una `/v2`, la `/v1` entra en periodo de convivencia anunciado con la cabecera `Sunset` y avisos de *deprecation*, dando a los integradores una ventana de migración predecible.

### 11.8 Seguridad y resiliencia

TLS en todo; **API Key** para el plan público y **OAuth2 client credentials** con *scopes* para cuotas ampliadas. Rate limiting por token con cabeceras del borrador IETF `RateLimit` y `429` + `Retry-After`. Como no hay escrituras públicas ni datos personales (los microdatos de Saber Pro se ingieren ya **anonimizados** y solo se exponen **agregados**, nunca registros individuales), la superficie de riesgo se concentra en disponibilidad y abuso, mitigada con CDN, caché y *circuit breakers* hacia las fuentes durante la ingesta.

### 11.9 Observabilidad y calidad operativa

Instrumentación con **OpenTelemetry** (trazas, métricas, logs correlacionados), SLO explícitos (p. ej. p99 de lectura < 200 ms servido desde borde; disponibilidad 99.9%), y un endpoint `/health`. Cada respuesta y cada registro llevan la fecha de la fuente, lo que permite alertar si una fuente oficial se quedó sin actualizar más allá de su frecuencia esperada. Las pruebas incluyen *contract testing* contra el OpenAPI, pruebas de propiedad sobre el normalizador (centinelas → `null`) y *golden files* de la salida de `/comparar`.

### 11.10 Integridad de la comparación (la técnica más importante para comparaU)

La mejor decisión técnica de un comparador no es de infraestructura sino de **honestidad de datos**. comparaU **no inventa un puntaje único**: el índice oficial MIDE fue descontinuado, así que combinar calidad, empleabilidad y deserción en un solo número sería una opinión disfrazada de dato. Por eso `/comparar` devuelve una **matriz de indicadores atómicos**, cada uno con su año, su unidad, su grano (institución/programa/NBC) y su fuente, más un arreglo de `advertencias` que señala cuándo dos valores no son estrictamente comparables (años distintos, NBC distinto, grano distinto). La ponderación se deja al usuario en la capa de presentación. Esta disciplina —medir cada cosa con su propia regla oficial y declarar los límites de la comparación— es lo que separa un comparador confiable de un ranking arbitrario.

---

*Contrato técnico: `openapi.yaml` · Guía rápida: `README.md`. Datos de origen bajo CC BY-SA 4.0 (datos.gov.co / Ministerio de Educación Nacional).*
