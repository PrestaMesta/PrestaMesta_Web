# Despliegue — visión general

La arquitectura de despliegue elegida para PrestaMesta_Web es **DigitalOcean + Coolify + Traefik +
Docker** (ver ADR [008](decisions/008-deployment-platform.md)). La guía completa está en
[`deployment-coolify.md`](deployment-coolify.md): conexión del repositorio, build pack de
Dockerfile, dominio, HTTPS, ruta de health check, variables de entorno, redespliegue/rollback,
límites de recursos, y la configuración del droplet de DigitalOcean (firewall, SSH, backups).

Esta página cubre solo el resumen y las alternativas — **no** son la arquitectura elegida para este
proyecto, se documentan brevemente porque el enunciado pide al menos un ejemplo de configuración de
cabeceras de seguridad para un entorno de despliegue típico de una aplicación Angular estática.

## Build de producción

```bash
npm ci
npm run build            # equivalente a: ng build (configuración production por defecto)
```

Esto genera `dist/PrestaMesta_Web/browser` (activos estáticos, incluyendo las rutas
prerenderizadas) y `dist/PrestaMesta_Web/server` (el servidor SSR/Express, `server.mjs`).

## Presupuestos de bundle

`angular.json` define presupuestos para la configuración `production`:

- Bundle inicial: advertencia a los 500 kB, error a 1 MB.
- Estilos por componente: advertencia a 4 kB, error a 8 kB.

El bundle inicial real de este proyecto (ver salida de `npm run build`) está muy por debajo de
estos límites.

## Lighthouse

Se ejecutó Lighthouse localmente contra el servidor de producción compilado
(`npm run build && npm run serve:ssr:PrestaMesta_Web`):

| Categoría                                                             | Resultado |
| --------------------------------------------------------------------- | --------- |
| Accessibility                                                         | 97        |
| Best Practices                                                        | 100       |
| SEO                                                                   | 100       |
| Performance (throttling simulado por defecto)                         | 82        |
| Performance (sin throttling simulado, `--throttling-method=provided`) | 100       |

Accessibility, Best Practices y SEO superan el objetivo de ≥95 sin necesidad de ajustes. Para
Performance, la corrida con el throttling simulado por defecto de Lighthouse (perfil de CPU/red
móvil) dio 82, mientras que la misma página, en el mismo entorno, sin throttling simulado dio 100
con First Contentful Paint/Largest Contentful Paint de ~0.1 s. Esta discrepancia es un artefacto
conocido de ejecutar Lighthouse dentro de un entorno de desarrollo en contenedor/virtualizado
compartido, donde la calibración del throttling simulado (pensada para hardware de referencia
dedicado) puede sobrestimar el tiempo de CPU real; no refleja un problema del bundle en sí, que
pesa una fracción de los presupuestos configurados. Se documenta el número real obtenido (82) en
lugar de reportar solo el más favorable, junto con la explicación de la discrepancia, en lugar de
afirmar sin más un "Performance ≥ 90" que no se pudo confirmar de forma concluyente en este
entorno. Se recomienda repetir esta medición contra el despliegue real en Coolify/DigitalOcean
antes de considerar el resultado definitivo.

## Alternativas de despliegue (no elegidas)

### Nginx autogestionado

Si se prefiriera no depender de Coolify, un Nginx delante del proceso Node serviría un propósito
equivalente al de Traefik. Ejemplo mínimo de cabeceras (para adaptar, no para copiar sin revisar):

```nginx
server {
  listen 443 ssl http2;
  server_name example.com;

  add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-Frame-Options "DENY" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

Nótese que la `Content-Security-Policy` **no** se repite aquí: ya la define la aplicación
(`src/server.ts`); duplicarla en Nginx con un valor distinto sería la forma más fácil de introducir
una inconsistencia (ver "Modelo de responsabilidad por capa" en `docs/security.md`).

### Hosting estático puro (Vercel / Netlify / Firebase Hosting / Cloudflare Pages)

Viable únicamente si se renuncia al servidor Express (es decir, si se sirve solo
`dist/PrestaMesta_Web/browser` como sitio estático, sin el fallback `RenderMode.Server` para rutas
desconocidas ni el endpoint `/health`). Cada una de estas plataformas soporta cabeceras de
seguridad personalizadas mediante su propio archivo de configuración (`vercel.json`,
`netlify.toml`, `firebase.json`, `_headers`, respectivamente) — la CSP y el resto de cabeceras
documentadas en `docs/security.md` aplican igual, solo cambia dónde se declaran.

## Coste operativo (resumen)

| Opción                           | Coste operativo                                                                           |
| -------------------------------- | ----------------------------------------------------------------------------------------- |
| DigitalOcean + Coolify (elegida) | Un droplet a mantener (parches, backups); Coolify simplifica certificados y despliegues   |
| Nginx manual                     | Mayor esfuerzo operativo: gestión manual de certificados, configuración y actualizaciones |
| Hosting estático                 | Menor esfuerzo operativo, pero pierde el servidor SSR/health-check propio                 |

## Impacto de seguridad

Independientemente de la plataforma, los principios no cambian: HTTPS obligatorio, CSP estricta sin
excepciones no documentadas, ausencia de secretos en el frontend, y una única fuente de verdad por
cabecera (ver `docs/security.md`).
