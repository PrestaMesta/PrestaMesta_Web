# 003 — Estrategia de estilos e iconografía

## Estado

Aceptada

## Fecha

2026-08-02

## Contexto

El enunciado pide Tailwind CSS como base, SCSS solo cuando Tailwind no alcance, y
`lucide-angular` para iconografía. Al intentar instalar `lucide-angular@1.0.0` se encontró que su
`peerDependencies` solo declara soporte hasta Angular 13.x–21.x, sin incluir Angular 22:

```text
npm error peer @angular/common@"13.x - 21.x" from lucide-angular@1.0.0
```

Instalar la librería de todas formas habría requerido `--legacy-peer-deps` o `--force`, aceptando
una resolución de dependencias potencialmente rota, algo que el propio proyecto pide evitar
("usa versiones compatibles entre sí").

## Decisión

- Se usa Tailwind CSS v4 (vía `@tailwindcss/postcss`), con el theming CSS-first (`@theme` en
  `src/styles.css`) para la paleta de marca (`navy-*`, `emerald-*`) y la tipografía.
- No se usa SCSS: los componentes no necesitan estilos que Tailwind no pueda expresar como clases
  de utilidad.
- En lugar de `lucide-angular`, se implementó un componente `Icon` propio
  (`shared/components/icon`) que dibuja a mano un subconjunto acotado de íconos en el mismo
  estilo visual (trazo de 24×24, `stroke-width` 2) que usa la aplicación. No depende de ningún
  paquete externo ni de una CDN.
- El logotipo de PrestaMesta es un SVG propio, escrito a mano en `shared/components/logo`.

## Alternativas consideradas

- **Forzar la instalación de `lucide-angular` con `--legacy-peer-deps`**: descartada por el riesgo
  de romper la resolución de dependencias de Angular en una versión que la librería no probó.
- **Usar una fuente de íconos basada en fuente de íconos (icon font)**: descartada porque requiere
  cargar un archivo de fuente adicional y no se alinea con "fuentes locales o del sistema".
- **Insertar SVGs sueltos en cada plantilla donde se necesite un ícono**: descartada por
  duplicación; un componente `Icon` centraliza el mismo trazo y tamaño en un solo lugar.

## Consecuencias positivas

- Cero dependencias de iconografía de terceros; el bundle de íconos es mínimo y a medida.
- No hay riesgo de que una futura actualización de Angular vuelva a romper la compatibilidad de
  peer dependencies de una librería de iconos.

## Consecuencias negativas

- El set de íconos es limitado al subconjunto que la aplicación necesita hoy; añadir un ícono
  nuevo requiere dibujar su `path` a mano en `icon.html`.

## Riesgos

Si `lucide-angular` publica una versión con soporte para Angular 22+, migrar sería un cambio
menor pero requeriría revisar cada uso de `<app-icon>`.

## Medidas de mitigación

El componente `Icon` expone la misma superficie (`name`, `size`) que tendría un envoltorio de
`lucide-angular`, por lo que una futura migración quedaría acotada a reemplazar la plantilla
interna del componente, no sus usos en el resto de la aplicación.
