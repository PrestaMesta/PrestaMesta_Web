# 001 — Uso de Angular como framework principal

## Estado

Aceptada

## Fecha

2026-08-02

## Contexto

El proyecto es una entrega académica para las materias de Arquitectura de Software y Seguridad
Informática. El enunciado exige explícitamente el uso de Angular, con TypeScript en modo estricto,
componentes standalone, Signals, Reactive Forms, Angular Router, SSR/prerenderizado y un enfoque
de seguridad basado en las protecciones que el framework ofrece de forma predeterminada
(saneamiento automático, enlace de datos seguro, etc.).

## Decisión

Se utiliza Angular 22 (última versión estable disponible al iniciar el proyecto), inicializado con
Angular CLI, en modo estricto de TypeScript, con SSR habilitado desde el principio mediante
`@angular/ssr`.

## Alternativas consideradas

- **React o Next.js**: framework popular con buen soporte de SSR, pero no cumple con el requisito
  explícito del enunciado de usar Angular, y no ofrece de fábrica un sistema de formularios
  reactivos ni una estrategia de saneamiento de plantillas equivalente a la de Angular.
- **Astro o un generador de sitios estáticos puro**: hubiera simplificado el prerenderizado, pero
  no permite construir la interactividad requerida (menú móvil, formulario, mockups con estado)
  con componentes reutilizables del mismo framework, y tampoco cumple el requisito de la materia.

## Consecuencias positivas

- Saneamiento de plantillas y protección contra XSS habilitados por defecto.
- Un único framework cubre routing, formularios, SSR y pruebas unitarias sin herramientas
  adicionales de terceros.
- Soporte oficial de primera clase para SSR/hidratación y prerenderizado (`@angular/ssr`).

## Consecuencias negativas

- Angular 22 es una versión reciente; algunas dependencias del ecosistema (por ejemplo,
  `lucide-angular`) todavía no declaran soporte de peer dependencies para esta versión (ver
  ADR 003).
- Curva de aprendizaje mayor que un stack más minimalista para quien no conozca Angular.

## Riesgos

Al ser una versión muy reciente del framework, ciertas librerías de terceros pueden tardar en
actualizar su compatibilidad declarada.

## Medidas de mitigación

Se prioriza depender únicamente de paquetes oficiales de Angular y de un número mínimo de
dependencias de terceros. Cuando una dependencia de terceros no declara soporte para Angular 22
(como ocurrió con `lucide-angular`), se opta por una alternativa propia en lugar de forzar la
instalación con `--force`/`--legacy-peer-deps`.
