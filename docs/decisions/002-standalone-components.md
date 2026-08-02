# 002 — Componentes standalone, sin NgModules

## Estado

Aceptada

## Fecha

2026-08-02

## Contexto

Angular permite construir aplicaciones completas sin `NgModule`, declarando las dependencias de
cada componente/directiva/pipe directamente en su decorador (`imports: [...]`). El enunciado pide
explícitamente evitar NgModules salvo que una dependencia externa lo requiera.

## Decisión

Toda la aplicación se construye con componentes, directivas y pipes standalone. No existe ningún
`NgModule` en el proyecto (ni siquiera un `AppModule`); el arranque se hace con
`bootstrapApplication` (`src/main.ts`) y la configuración de providers vive en `app.config.ts` /
`app.config.server.ts`.

## Alternativas consideradas

- **NgModules tradicionales**: es el enfoque histórico de Angular, pero añade una capa de
  organización (módulos de característica, módulos compartidos) que no aporta valor en un proyecto
  de este tamaño y que el propio equipo de Angular ha ido desplazando en favor de standalone.

## Consecuencias positivas

- Cada componente declara explícitamente sus dependencias, lo que facilita saber qué usa qué sin
  rastrear una jerarquía de módulos.
- Permite lazy loading por componente (`loadComponent`) sin necesidad de módulos de ruta
  dedicados.
- Menos código repetitivo (boilerplate).

## Consecuencias negativas

- Los `imports` de cada componente pueden crecer si el componente usa muchas piezas compartidas
  (mitigado manteniendo los componentes pequeños, ver `docs/architecture.md`).

## Riesgos

Ninguno relevante: standalone es el modelo recomendado y soportado activamente por Angular.

## Medidas de mitigación

No aplica.
