# 004 — Estrategia de renderizado: SSR con prerenderizado selectivo

## Estado

Aceptada

## Fecha

2026-08-02

## Contexto

PrestaMesta es una landing page orientada a SEO, metadatos sociales (Open Graph/Twitter Card) y
tiempo de carga inicial. El enunciado pide evaluar entre una app estática prerenderizada, SSR, o
una aplicación cliente tradicional, priorizando SEO y rendimiento, y evitando SSR "solo por
complejidad académica" si el prerenderizado ya cubre los requisitos.

Casi todas las rutas de este sitio son contenido estático (no dependen de datos por usuario ni de
parámetros de URL): `/`, `/aviso-de-privacidad`, `/terminos-de-uso`, `/seguridad`, `/404`. Ninguna
ruta necesita datos que solo existan en tiempo de petición.

## Decisión

Se usa Angular SSR (`@angular/ssr`) configurado con `RenderMode.Prerender` para cada una de las
rutas conocidas (contenido 100% estático en build time) y `RenderMode.Server` únicamente para el
comodín `**` (rutas desconocidas, para las que no existe un conjunto finito de URLs que generar en
build time). En la práctica, el sitio se comporta como una aplicación prerenderizada para todas
las páginas reales, con SSR bajo demanda solo como red de seguridad para URLs no reconocidas.

El servidor Express (`src/server.ts`) que sirve los archivos prerenderizados y maneja el caso SSR
restante se empaqueta como imagen Docker y se despliega en Coolify (ver ADR 008).

## Alternativas consideradas

- **Aplicación 100% estática (sin `@angular/ssr` en absoluto)**: hubiera simplificado el
  despliegue (sin proceso Node en runtime), pero Angular no ofrece un modo "solo prerenderizado
  sin servidor" tan maduro como el flujo integrado de `@angular/ssr` con `outputMode: server`, y
  perderíamos el fallback `RenderMode.Server` para rutas no listadas.
- **Aplicación cliente pura (sin SSR ni prerenderizado)**: descartada porque el HTML inicial
  llegaría vacío, perjudicando SEO, metadatos sociales al compartir enlaces, y el tiempo hasta
  contenido visible.
- **SSR puro para todas las rutas (sin prerenderizado)**: descartada porque añade coste de cómputo
  en cada petición sin ningún beneficio, dado que el contenido de estas páginas no cambia entre
  peticiones.

## Consecuencias positivas

- HTML completo disponible para crawlers y para vistas previas de redes sociales sin ejecutar
  JavaScript.
- Tiempo hasta primer contenido visible (FCP) bajo, ya que las páginas reales se sirven como
  archivos estáticos.
- El servidor Express sigue existiendo para health checks, cabeceras de seguridad y como red de
  seguridad ante rutas no listadas.

## Consecuencias negativas

- Sigue siendo necesario un proceso Node en producción (a diferencia de un sitio 100% estático
  servido desde un CDN), lo que implica gestionar un contenedor con su propio ciclo de vida.
- La hidratación del cliente introduce una ventana breve entre "HTML visible" y "totalmente
  interactivo"; ver `docs/testing.md` para cómo esto afecta a las pruebas end-to-end.

## Riesgos

Si en el futuro se agregan rutas verdaderamente dinámicas (por ejemplo, contenido específico por
usuario autenticado), su modo de renderizado tendría que revisarse individualmente.

## Medidas de mitigación

`app.routes.server.ts` mapea cada ruta explícitamente a un `RenderMode`, de forma que agregar una
ruta nueva obliga a decidir conscientemente su estrategia de renderizado en lugar de heredar un
comportamiento por defecto implícito.
