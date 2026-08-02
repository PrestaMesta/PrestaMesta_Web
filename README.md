# PrestaMesta_Web

Landing page de **PrestaMesta**, una aplicación móvil de préstamos personales — proyecto
**académico y demostrativo** construido con Angular para las materias de Arquitectura de Software
y Seguridad Informática.

> PrestaMesta no otorga préstamos reales, no procesa pagos ni evaluaciones crediticias. Ver
> [`/terminos-de-uso`](src/app/features/terms) y [`/aviso-de-privacidad`](src/app/features/privacy).

## Objetivos académicos

- Aplicar buenas prácticas de arquitectura de software con Angular (standalone components,
  Signals, arquitectura por características) de forma proporcional al tamaño del proyecto.
- Aplicar un enfoque de seguridad basado en OWASP: CSP estricta, validación de entradas,
  codificación segura de salidas, gestión segura de configuración, mínimo privilegio, y
  documentación explícita de qué está implementado frente a lo que se propone o dependería de un
  backend futuro.
- Demostrar un modelo de amenazas (STRIDE) y decisiones de arquitectura documentadas (ADRs).

## Capturas

_Pendiente: agregar capturas de pantalla reales del sitio desplegado. Mientras tanto, ejecuta
`npm start` y visita `http://localhost:4200/` para verlo en vivo._

## Requisitos

- Node.js ≥ 22 (ver `engines` en `package.json`)
- npm ≥ 10

## Instalación

```bash
npm ci
```

## Desarrollo local

```bash
npm start
```

Abre `http://localhost:4200/`. La app usa Angular SSR incluso en modo desarrollo (verás en la
consola del navegador un mensaje de "Angular hydrated..."), así que el HTML inicial ya llega
renderizado desde el servidor de desarrollo.

## Configuración pública del frontend

`public/config/app-config.json` se sirve como archivo estático y se carga en el arranque de la
aplicación (`AppConfigService`). Todos los campos son públicos por diseño — nunca coloques un
secreto aquí (ver ADR [006](docs/decisions/006-public-runtime-configuration.md)):

```json
{
  "apkDownloadUrl": "",
  "apkVersion": "",
  "apkSha256": "",
  "apkReleaseDate": "",
  "apkFileSize": "",
  "siteUrl": "",
  "githubUrl": "",
  "contactEmail": ""
}
```

- Si `apkDownloadUrl` está vacío o no pasa la validación (HTTPS, sin credenciales embebidas, host
  permitido), la sección de descarga muestra "APK no disponible" en lugar de romperse.
- `siteUrl`, `githubUrl` y `contactEmail` controlan si ciertos elementos del footer y de los
  metadatos SEO (URL canónica, `og:url`) se muestran; si están vacíos, simplemente no aparecen.

## Configuración de la APK y generación del hash

1. Sube el archivo `.apk` a donde vaya a publicarse (por ejemplo, un GitHub Release).
2. Genera su hash SHA-256:

   ```bash
   # Linux
   sha256sum prestamesta.apk

   # macOS
   shasum -a 256 prestamesta.apk

   # Windows PowerShell
   Get-FileHash .\prestamesta.apk -Algorithm SHA256
   ```

3. Completa `public/config/app-config.json` con la URL, la versión, el hash, la fecha y el tamaño.
4. Verifica el hash: cualquier persona puede repetir el paso 2 sobre el archivo descargado y
   comparar el resultado con el publicado en el sitio — deben coincidir exactamente.

## Variables de entorno del backend (opcional)

El sitio principal **no** requiere ningún backend: el formulario de novedades opera en modo de
demostración (ver ADR [007](docs/decisions/007-form-backend.md)). El repositorio incluye, como
referencia independiente, un servidor Express mínimo en `server/` — no está conectado al build de
Angular, a Docker, ni a CI. Para ejecutarlo por separado:

```bash
cd server
npm install
npm test    # pruebas del validador de correo, el honeypot y el rate limiter
npm start   # escucha en http://localhost:3001
```

Sus variables de entorno están documentadas en `.env.example` (en la raíz del repositorio) —
cópialo a `server/.env` y complétalo; nunca subas un `.env` con valores reales.

## Pruebas

```bash
npm test              # unitarias (Vitest)
npm run test:coverage # unitarias con cobertura
npm run test:e2e      # end-to-end (Playwright; instala navegadores con `npx playwright install` si es la primera vez)
```

Ver `docs/testing.md` para el detalle de qué cubre cada suite.

## Build

```bash
npm run build          # equivalente a `ng build` (producción por defecto)
npm run build:prod     # explícito, misma configuración
```

Genera `dist/PrestaMesta_Web/browser` (estático, incluye rutas prerenderizadas) y
`dist/PrestaMesta_Web/server` (servidor SSR).

## SSR / prerenderizado

La mayoría de las rutas se prerenderizan en build time; el comodín `**` (rutas desconocidas) se
renderiza bajo demanda vía SSR. Ver ADR [004](docs/decisions/004-rendering-strategy.md).

Para ejecutar el servidor SSR compilado localmente:

```bash
npm run build
npm run serve:ssr:PrestaMesta_Web
```

## Sitemap

`public/sitemap.xml` no se genera con un dominio inventado. Una vez que `siteUrl` esté configurado
en `public/config/app-config.json`, genera el sitemap real con:

```bash
npm run generate:sitemap
```

## Despliegue

Arquitectura principal: DigitalOcean + Coolify + Traefik + Docker. Ver
[`docs/deployment-coolify.md`](docs/deployment-coolify.md) (guía completa) y
[`docs/deployment.md`](docs/deployment.md) (resumen y alternativas).

```bash
docker build -t prestamesta-web .
docker run --rm -p 4000:4000 prestamesta-web
curl http://localhost:4000/health
```

## Arquitectura

Ver [`docs/architecture.md`](docs/architecture.md) (contexto, diagramas Mermaid, organización de
carpetas, flujo de datos) y [`docs/decisions/`](docs/decisions/) (ADRs).

## Seguridad

Ver [`docs/security.md`](docs/security.md) (controles OWASP implementados, CSP, cabeceras, y el
compromiso documentado sobre hidratación de eventos de Angular) y
[`docs/threat-model.md`](docs/threat-model.md) (modelo de amenazas STRIDE). Para reportar una
vulnerabilidad, ver [`SECURITY.md`](SECURITY.md).

## Accesibilidad

Ver [`docs/accessibility.md`](docs/accessibility.md).

## Limitaciones conocidas

- No hay backend real desplegado; el formulario de novedades es una simulación (ver ADR 007).
- No existe todavía un dominio de producción, por lo que `siteUrl`/`githubUrl`/`contactEmail` y el
  sitemap quedan vacíos por defecto — ningún valor de ejemplo fue inventado.
- Las pruebas end-to-end corren solo en Chromium.
- No se realizó una auditoría de seguridad ni de accesibilidad manual por una persona
  especialista; ver las secciones de límites en `docs/security.md` y `docs/accessibility.md`.

## Aviso académico

Este repositorio es una entrega académica. Los textos legales (`/aviso-de-privacidad`,
`/terminos-de-uso`) no han sido revisados por asesoría jurídica y no deben usarse tal cual en un
lanzamiento real.
