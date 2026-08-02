# 008 — Plataforma de despliegue: DigitalOcean + Coolify + Traefik + Docker

## Estado

Aceptada

## Fecha

2026-08-02

## Contexto

La aplicación necesita un entorno de producción real (o al menos reproducible) para el servidor
Express/SSR. Las opciones típicas para una app Angular SSR incluyen un VPS con Nginx gestionado a
mano, una PaaS gestionada, o una plataforma de auto-hospedaje tipo Coolify sobre un VPS propio.

## Decisión

El objetivo de despliegue principal es:

- Un droplet de **DigitalOcean** como servidor.
- **Coolify** instalado en ese droplet como plataforma de despliegue.
- La aplicación empaquetada como **imagen Docker** (`Dockerfile` multi-etapa, usuario no-root,
  `/health`, `HEALTHCHECK`, apagado ordenado ante `SIGTERM`/`SIGINT`).
- El proxy **Traefik** que Coolify administra internamente se encarga del enrutamiento público, la
  terminación TLS y los certificados Let's Encrypt. El contenedor de la aplicación **no** se
  expone directamente a internet.

Nginx y los hosts estáticos (Vercel/Netlify/Firebase/Cloudflare Pages) se documentan únicamente
como alternativas breves en `docs/deployment.md`, no como la arquitectura elegida. La guía
detallada de despliegue vive en `docs/deployment-coolify.md`.

## Alternativas consideradas

- **Nginx autogestionado en un VPS**: es la opción "por defecto" que sugiere el enunciado en
  general, pero se descarta como arquitectura principal porque Coolify ya provee un proxy inverso
  (Traefik) con gestión de certificados y de dominios; añadir Nginx encima sería una capa
  redundante que además complicaría saber qué componente es dueño de cada cabecera de seguridad.
- **Hosting estático puro (Vercel/Netlify/Firebase/Cloudflare Pages)**: viable para el build
  prerenderizado, pero estas plataformas no ejecutan de forma nativa el servidor Express que sirve
  el health check y el fallback SSR (`RenderMode.Server` para `**`); se documentan como
  alternativa para quien decida no usar SSR en absoluto.
- **Contenedor Nginx adicional delante de la app dentro de Coolify**: descartada salvo que surja
  una necesidad técnica concreta (por ejemplo, servir archivos estáticos con reglas muy
  específicas que Express no cubra), ya que Traefik + Express ya cubren TLS, cabeceras y archivos
  estáticos.

## Consecuencias positivas

- Un solo Dockerfile define exactamente cómo se construye y ejecuta la aplicación en cualquier
  entorno (local, CI, producción), reduciendo el problema de "funciona en mi máquina".
- Coolify simplifica los certificados TLS y el reinicio/rollback de despliegues sin necesidad de
  administrar Nginx a mano.
- El contenedor de la aplicación nunca queda expuesto directamente; solo Traefik lo está.

## Consecuencias negativas

- Depende de la disponibilidad y correcto funcionamiento de Coolify como capa de gestión; un fallo
  en Coolify/Traefik afecta a todos los servicios que dependan de él en el mismo droplet.
- Requiere mantener el propio droplet (parches del sistema operativo, backups) — responsabilidad
  que un PaaS totalmente gestionado absorbería.

## Riesgos

Un firewall mal configurado en el droplet podría exponer accidentalmente el puerto del contenedor
de la aplicación directamente a internet, sorteando a Traefik.

## Medidas de mitigación

`docs/deployment-coolify.md` documenta explícitamente qué puertos deben quedar expuestos en el
firewall de DigitalOcean (solo 22/SSH restringido, 80/443 para Traefik) y recuerda no publicar el
puerto del contenedor de la aplicación directamente.
