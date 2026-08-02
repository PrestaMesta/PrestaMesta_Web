# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Este proyecto no seguía
versionado semántico previo a esta entrega; `0.1.0` marca la primera versión funcional completa de
la landing page académica.

## [0.1.0] - 2026-08-02

### Added

- Landing page completa de PrestaMesta con Angular 22 (standalone components, Signals, Reactive
  Forms, Angular Router, `@angular/ssr`).
- Sistema de diseño propio con Tailwind CSS v4 (paleta navy/emerald), logotipo e íconos en SVG
  originales (sin dependencias externas de iconografía).
- Header accesible con menú móvil (focus trap, cierre con Escape, ARIA) y footer con enlaces
  condicionados a la configuración pública.
- Secciones de la página de inicio: hero, beneficios, cómo funciona, vista previa de la app
  (mockups interactivos), seguridad, descarga de APK, formulario de novedades, preguntas
  frecuentes.
- Descarga segura de APK: configuración pública en tiempo de ejecución, validación de URL y de
  hash SHA-256, copia del hash, estados seguros sin configuración.
- Formulario de novedades en modo de demostración, con Reactive Forms, honeypot, y prevención de
  envíos duplicados.
- Páginas de aviso de privacidad, términos de uso, seguridad (detalle) y 404.
- Cabeceras de seguridad (CSP estricta sin `unsafe-inline`/`unsafe-eval`, `X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `Cross-Origin-*`) servidas desde el
  servidor Express (`src/server.ts`), con HSTS delegado a la capa de proxy (Traefik).
- `Dockerfile` multi-etapa para producción (usuario no-root, `/health`, `HEALTHCHECK`, apagado
  ordenado ante `SIGTERM`/`SIGINT`).
- 74 pruebas unitarias (Vitest) y 15 pruebas end-to-end (Playwright).
- Pipeline de CI en GitHub Actions: formato, lint, type-check, pruebas unitarias, build, pruebas
  end-to-end, auditoría de dependencias, escaneo de secretos.
- Documentación de arquitectura, seguridad, modelo de amenazas STRIDE, accesibilidad, pruebas,
  despliegue (Coolify/DigitalOcean), y ocho ADRs.

### Known limitations

- Sin backend real desplegado (ver ADR 007); el formulario de novedades es una simulación.
- Sin dominio de producción configurado; `siteUrl`/`githubUrl`/`contactEmail` y el sitemap quedan
  vacíos hasta que se configuren.
- Sin auditoría de seguridad o accesibilidad manual por una persona especialista.
