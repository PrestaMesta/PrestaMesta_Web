# Accesibilidad — PrestaMesta_Web

Objetivo: cumplir con un nivel razonable de WCAG 2.2 AA en los elementos principales del sitio.
Este documento describe qué se implementó y cómo verificarlo; no sustituye una auditoría manual
con lectores de pantalla reales ni una revisión por una persona especialista en accesibilidad.

## Estructura y semántica

- HTML semántico en toda la aplicación: `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`,
  encabezados jerárquicos (`h1` único por página, `h2`/`h3` en cascada).
- El acordeón de preguntas frecuentes usa los elementos nativos `<details>`/`<summary>` en lugar de
  un widget ARIA hecho a mano: es accesible por teclado y para lectores de pantalla sin necesidad
  de JavaScript ni atributos ARIA adicionales.
- No se agregan atributos ARIA donde un elemento HTML semántico ya resuelve el problema (por
  ejemplo, `<nav aria-label="...">` en vez de `role="navigation"` redundante).

## Navegación por teclado

- **Skip link**: el primer elemento enfocable de la página es un enlace "Saltar al contenido
  principal" (`src/app/app.html`), visible al recibir foco, que salta a `<main id="main-content">`.
- **Menú móvil**: se abre y cierra con el ratón y con teclado (Enter/Espacio sobre el botón); usa
  `aria-expanded` y `aria-controls`; se cierra con la tecla `Escape`
  (`@HostListener('document:keydown.escape')` en `Header`); el foco vuelve al botón que lo abrió al
  cerrarse; mientras está abierto, el foco queda atrapado dentro del panel mediante
  `FocusTrapDirective` (`shared/directives/focus-trap.directive.ts`), para que Tab no escape hacia
  contenido oculto detrás del overlay.
- **Badges de tienda ("Próximamente")**: son botones reales, alcanzables y activables por teclado,
  que revelan un mensaje mediante `aria-live="polite"` en lugar de ser elementos deshabilitados sin
  ninguna forma de interactuar con ellos.
- Verificado en `tests/e2e/navigation.spec.ts`: la tecla Tab llega primero al skip link, el menú
  móvil se abre/cierra correctamente, y el acordeón de FAQ responde al clic (equivalente a
  Enter/Espacio sobre el `<summary>` nativo).

## Foco visible

`src/styles.css` define un anillo de foco consistente (`:focus-visible`) en todo el sitio, en lugar
de depender del estilo por defecto — frecuentemente inconsistente — de cada navegador.

## Contraste

La paleta (`navy-*`, `emerald-*` en `src/styles.css`) se eligió pensando en contraste AA:

- Los botones primarios usan `emerald-700`/`emerald-800` (no `emerald-500`/`600`, cuyo contraste
  con texto blanco no alcanza 4.5:1 a tamaños de texto normales).
- El texto principal usa `navy-900`/`navy-700` sobre fondos claros, y `white`/`navy-100` sobre el
  footer oscuro (`navy-950`).

## No depender únicamente del color

En la sección de seguridad, cada control muestra tanto un color de fondo distinto **como** una
etiqueta de texto explícita ("Implementado en este sitio", "Propuesto para la app móvil",
"Dependería de un backend futuro"), para que la distinción no dependa exclusivamente de percibir el
color.

## Formularios

- Todas las entradas tienen una etiqueta (`<label for="...">`) asociada.
- Los mensajes de error están asociados mediante `aria-describedby` y se anuncian con
  `aria-live="polite"` (errores de validación) o `aria-live="assertive"` (error de envío).
- Los estados de envío (`Enviando…`, éxito, error) son perceptibles tanto visualmente como para
  tecnologías de asistencia.
- El campo honeypot se oculta con la clase `sr-only` (recorte visual estándar) y `aria-hidden`,
  y además tiene `tabindex="-1"` para que nunca reciba foco por teclado — verificado en
  `tests/e2e/launch-notification-form.spec.ts`.

## `prefers-reduced-motion`

`src/styles.css` reduce prácticamente a cero la duración de animaciones y transiciones, y
desactiva el scroll suave, cuando la persona usuaria tiene activada la preferencia de "reducir
movimiento" en su sistema operativo.

## Tamaños de área táctil

Los botones y enlaces principales usan relleno (`padding`) generoso (`py-3`/`py-3.5` en Tailwind,
≈44px de alto), consistente con el tamaño mínimo recomendado para áreas táctiles.

## Verificación

- **Automatizada**: `@angular-eslint/template` incluye las reglas de
  `angular.configs.templateAccessibility`, que revisan las plantillas en cada `npm run lint`
  (por ejemplo, exige texto alternativo en imágenes, roles válidos, etc.).
- **End-to-end**: `tests/e2e/navigation.spec.ts` y `tests/e2e/home.spec.ts` verifican el
  comportamiento por teclado (skip link, menú móvil, Escape) de forma automatizada en cada
  ejecución de CI.
- **Manual (pendiente/recomendada)**: no se realizó una pasada manual con un lector de pantalla
  real (NVDA, VoiceOver, TalkBack) como parte de esta entrega. Se recomienda como siguiente paso
  antes de cualquier lanzamiento real.

## Limitaciones conocidas

Ninguna herramienta automática (linter, Playwright) garantiza el cumplimiento completo de WCAG.
Estas verificaciones detectan una fracción de los problemas de accesibilidad reales; no sustituyen
una revisión manual.
