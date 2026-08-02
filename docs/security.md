# Seguridad — PrestaMesta_Web

> "La seguridad no es una función adicional: forma parte de cada decisión de diseño."

Este documento describe los controles de seguridad realmente implementados en este repositorio,
distinguiéndolos de los que se proponen para una futura aplicación móvil y de los que dependerían
de un backend que hoy no existe. No se afirma ningún cumplimiento normativo, certificación o
auditoría que no se haya realizado.

## Modelo de responsabilidad por capa

Esta aplicación se despliega detrás de Traefik (gestionado por Coolify). Para que ninguna cabecera
de seguridad se defina dos veces con valores potencialmente distintos, cada cabecera tiene un único
dueño:

| Cabecera                       | Dueño                 | Dónde se define                                   |
| ------------------------------ | --------------------- | ------------------------------------------------- |
| `Content-Security-Policy`      | Aplicación (Express)  | `src/server.ts`                                   |
| `X-Content-Type-Options`       | Aplicación (Express)  | `src/server.ts`                                   |
| `X-Frame-Options`              | Aplicación (Express)  | `src/server.ts`                                   |
| `Referrer-Policy`              | Aplicación (Express)  | `src/server.ts`                                   |
| `Permissions-Policy`           | Aplicación (Express)  | `src/server.ts`                                   |
| `Cross-Origin-Opener-Policy`   | Aplicación (Express)  | `src/server.ts`                                   |
| `Cross-Origin-Resource-Policy` | Aplicación (Express)  | `src/server.ts`                                   |
| `Strict-Transport-Security`    | Traefik (proxy HTTPS) | Coolify/Traefik, ver `docs/deployment-coolify.md` |

HSTS solo tiene sentido una vez que HTTPS está correctamente configurado extremo a extremo; por
eso se define exclusivamente en la capa que termina TLS (Traefik), no en la aplicación. Definirla
en ambos lugares no rompería nada por sí solo, pero sí duplicaría una configuración que debe
mantenerse sincronizada (`max-age`, `includeSubDomains`, `preload`) — se prefiere un único dueño.

## Content Security Policy

```text
default-src 'self';
script-src 'self';
style-src 'self';
img-src 'self';
font-src 'self';
connect-src 'self';
manifest-src 'self';
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
```

Puntos relevantes:

- **Sin `unsafe-inline` ni `unsafe-eval` en ningún directive.** Esto fue posible porque:
  - La aplicación no usa `styleUrl`/`styles` a nivel de componente (todo el estilo son clases de
    Tailwind compiladas en una única hoja externa), por lo que Angular no necesita inyectar
    `<style>` en tiempo de ejecución.
  - El build de producción desactiva el inlining de CSS crítico
    (`optimization.styles.inlineCritical: false` en `angular.json`) para no depender de un
    `<style>` inline en el `index.html` generado.
  - `provideClientHydration(withNoIncrementalHydration())` evita el script de arranque
    (`ng-event-dispatch-contract`) que Angular inserta para la hidratación incremental — una
    característica que esta aplicación no usa, ya que no hay bloques `@defer`.
- **Compromiso documentado**: Angular ofrece `withEventReplay()` para capturar y reproducir
  interacciones ocurridas antes de que termine la hidratación. Habilitarlo reintroduce un script
  inline (el "contrato" de despacho de eventos), que una CSP estricta bloquea sin una excepción
  (`'unsafe-inline'`, un hash, o un nonce por petición). Se evaluaron ambas alternativas:
  - **Nonce por petición** (`CSP_NONCE` de Angular): es la solución "de libro", pero requiere
    generar un nonce distinto en cada respuesta SSR y verificar que el motor de renderizado de
    `@angular/ssr` lo aplique también al script de arranque de eventos (no solo a los `<style>`
    dinámicos, que es el caso documentado). No se pudo confirmar con certeza ese comportamiento
    para esta versión sin arriesgar una implementación a medias.
  - **Hash de CSP**: descartada porque el contenido exacto del script de arranque varía según los
    tipos de evento usados en cada página, lo que obligaría a mantener múltiples hashes y
    corre el riesgo de quedar desactualizado silenciosamente.
  - **Decisión final**: mantener la CSP estricta y **no** habilitar `withEventReplay()`. El riesgo
    residual es una ventana muy breve (el tiempo de hidratación, típicamente inferior a un
    segundo) en la que una interacción ocurrida _antes_ de que Angular termine de hidratar podría
    perderse. Se documenta como limitación conocida en `docs/testing.md`.
- Se prefirió `frame-ancestors 'none'` (CSP) además de `X-Frame-Options: DENY` como defensa en
  profundidad contra clickjacking, ya que `X-Frame-Options` sigue siendo respetado por navegadores
  que todavía no priorizan `frame-ancestors`.

## Controles OWASP implementados en este repositorio

| Control                                | Estado                                      | Dónde                                                                                 |
| -------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------- |
| Cifrado en tránsito (HTTPS)            | Implementado en producción (Traefik)        | `docs/deployment-coolify.md`                                                          |
| Validación de entradas                 | Implementado                                | `shared`/`features/*/validators`                                                      |
| Codificación segura de salidas         | Implementado (por defecto de Angular)       | Toda la aplicación — sin `innerHTML`                                                  |
| CSP restrictiva                        | Implementado                                | `src/server.ts`                                                                       |
| Protección contra clickjacking         | Implementado                                | `X-Frame-Options` + `frame-ancestors 'none'`                                          |
| `X-Content-Type-Options`               | Implementado                                | `src/server.ts`                                                                       |
| Referrer Policy                        | Implementado                                | `src/server.ts`                                                                       |
| Permissions Policy                     | Implementado                                | `src/server.ts`                                                                       |
| HSTS                                   | Implementado (capa de proxy)                | Traefik/Coolify                                                                       |
| Gestión segura de configuración        | Implementado                                | `AppConfigService` + `parseAppConfig`                                                 |
| Ausencia de secretos en el repositorio | Implementado                                | Escaneo de secretos en CI                                                             |
| Prevención de redirecciones abiertas   | Implementado                                | La URL de la APK nunca viene de query params; se valida con lista de hosts permitidos |
| Integridad de archivos descargables    | Implementado                                | Validación y visualización del hash SHA-256                                           |
| CORS restrictivo                       | Implementado (en el servidor de referencia) | `server/` — no aplica al sitio principal, que no expone una API                       |
| Mínimo privilegio (contenedor)         | Implementado                                | `Dockerfile` — usuario no-root                                                        |
| Rate limiting                          | Implementado (en el servidor de referencia) | `server/`                                                                             |
| Límite de tamaño de solicitudes        | Implementado (en el servidor de referencia) | `server/`                                                                             |

## Prácticas explícitamente evitadas

De acuerdo con el enunciado, este código **no** usa: `innerHTML`, `outerHTML`, `eval`,
`new Function`, `document.write`, `bypassSecurityTrustHtml`, `bypassSecurityTrustScript`,
`bypassSecurityTrustUrl`, construcción dinámica de URLs a partir de entradas del usuario,
almacenamiento de tokens sensibles en `localStorage`, ni carga de scripts de terceros desde una
CDN.

## Dependencias y su triaje

`npm audit` reporta actualmente 6 vulnerabilidades de severidad **moderada**, todas originadas en
una dependencia transitiva de `@angular/cli` (`@modelcontextprotocol/sdk` → `@hono/node-server`,
usada por la función de servidor MCP opcional del propio Angular CLI). Es una dependencia de
**desarrollo** (no se incluye en el bundle de producción ni en la imagen Docker final, que solo
instala `dependencies`, no `devDependencies`). El pipeline de CI ejecuta
`npm audit --audit-level=high` de forma informativa (no bloqueante) precisamente para no fallar
builds por hallazgos de baja severidad en herramientas de desarrollo, mientras sigue siendo visible
en los logs de cada ejecución.

## Límites de las verificaciones automatizadas

Ni `npm audit`, ni el escaneo de secretos, ni las pruebas end-to-end constituyen una auditoría de
seguridad. Son verificaciones automatizadas con alcance limitado: no sustituyen una revisión
manual, un pentest, ni el análisis de un profesional de seguridad antes de cualquier lanzamiento
real.
