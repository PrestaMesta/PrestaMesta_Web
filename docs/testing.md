# Pruebas — PrestaMesta_Web

## Resumen

| Tipo       | Herramienta                             | Comando                 | Dónde                         |
| ---------- | --------------------------------------- | ----------------------- | ----------------------------- |
| Unitarias  | Vitest (vía `@angular/build:unit-test`) | `npm test`              | `src/app/**/*.spec.ts`        |
| Cobertura  | Vitest `--coverage`                     | `npm run test:coverage` | mismo lugar que las unitarias |
| End-to-end | Playwright                              | `npm run test:e2e`      | `tests/e2e/**/*.spec.ts`      |

## Pruebas unitarias

### Funciones puras (sin `TestBed`)

Se prueban directamente, sin levantar Angular, porque son funciones puras:

- `features/apk-download/validators/url.validator.spec.ts` — acepta HTTPS válido; rechaza vacío,
  malformado, `javascript:`/`data:`/`file:`/`blob:`, HTTP fuera de localhost, credenciales
  embebidas, y hosts fuera de la lista permitida; acepta HTTP en localhost solo en modo desarrollo.
- `features/apk-download/validators/sha256.validator.spec.ts` — formato exacto de 64 caracteres
  hexadecimales, insensible a mayúsculas, sin espacios internos.
- `features/launch-notification/validators/email.validator.spec.ts` — formato, longitud máxima,
  normalización, y el `ValidatorFn` de Reactive Forms.
- `core/config/app-config.model.spec.ts` — `parseAppConfig` ante `null`/`undefined`/tipos
  incorrectos/propiedades inesperadas/valores en blanco.

### Servicios (con `TestBed`, sin DOM real)

- `core/config/app-config.service.spec.ts` — usa `HttpTestingController` para simular una
  respuesta válida, una respuesta malformada, y un error HTTP; verifica que en los tres casos la
  señal de configuración queda en un estado seguro y que `load()` nunca rechaza la promesa.
- `features/apk-download/services/apk-download.service.spec.ts` — sustituye `AppConfigService` por
  un doble de prueba para cubrir: sin URL configurada, URL válida con host permitido, protocolo
  inseguro, host no permitido, hash inválido, y las tres ramas de `copyHash()` (sin hash, éxito,
  fallo del portapapeles).
- `core/services/seo.service.spec.ts` — verifica que se actualizan `description`, `og:*`,
  `twitter:*`, y que el enlace canónico solo se agrega cuando hay un `siteUrl` configurado.

### Componentes (con `TestBed` y DOM simulado)

- `layout/header/header.spec.ts` — estado inicial del menú móvil, apertura/cierre por clic, cierre
  con `Escape`.
- `features/home/sections/faq/faq.spec.ts` — cada pregunta se renderiza como un `<details>` cerrado
  con su `<summary>`.
- `features/apk-download/components/apk-download-section/apk-download-section.spec.ts` — estado
  del botón (deshabilitado/habilitado), atributos del enlace de descarga, y la interacción de
  copiar el hash.
- `features/launch-notification/components/launch-notification-form/launch-notification-form.spec.ts`
  — errores de validación, envío exitoso, honeypot (no llama al servicio real), y el guard contra
  doble envío.

## Pruebas end-to-end (Playwright)

`tests/e2e/`:

- `home.spec.ts` — título principal visible, navegación por el menú, skip link, atributos seguros
  en enlaces externos (`target="_blank"` + `rel="noopener noreferrer"`), ausencia de errores graves
  de consola en las rutas principales, página 404 para rutas desconocidas.
- `navigation.spec.ts` — menú móvil (abrir/cerrar/Escape/cierre al seleccionar), navegación por
  teclado (Tab llega primero al skip link), acordeón de FAQ.
- `apk-download.spec.ts` — **escenario sin configuración** (usa el `public/config/app-config.json`
  real del repositorio, que llega vacío) verificando el botón deshabilitado y el mensaje
  explicativo; **escenario con configuración válida**, interceptando la petición a
  `/config/app-config.json` con `page.route(...)` para servir un fixture con URL y hash válidos,
  verificando el enlace habilitado, sus atributos, y que copiar el hash muestra la confirmación.
- `launch-notification-form.spec.ts` — validación de correo, validación de consentimiento, envío
  exitoso en modo demostración, y que el campo honeypot nunca es alcanzable con Tab.

### Por qué algunas pruebas esperan a `networkidle`

Esta aplicación usa Angular SSR con hidratación: el HTML llega ya renderizado desde el servidor,
pero los manejadores de eventos de Angular (`RouterLink`, `(click)`, Reactive Forms) solo quedan
activos una vez que el bundle del cliente termina de hidratar esa marca. Durante el desarrollo de
esta suite se observó que interactuar con la página _inmediatamente_ después de `page.goto()`
—antes de que termine la hidratación— podía hacer que un `fill()` o un `click()` de Playwright no
llegaran a ningún manejador de Angular todavía activo, produciendo fallos intermitentes
indistinguibles de un error real de validación.

Por eso, las pruebas que escriben en un campo o hacen clic en un control ligado a Angular
inmediatamente después de navegar usan `page.goto(url, { waitUntil: 'networkidle' })`. Esto no es
"ocultar" un bug: es una característica inherente a cualquier aplicación con SSR + hidratación (no
solo Angular), y una persona usuaria real —que tarda al menos unos cientos de milisegundos en leer
la página antes de interactuar— prácticamente nunca la experimenta. Ver también
`docs/security.md` para la relación de este mismo comportamiento con la decisión de no habilitar
`withEventReplay()`.

## Cobertura no automatizada / limitaciones

- No se realizaron pruebas de carga ni de estrés.
- No se ejecutó un auditor de accesibilidad automático dedicado (por ejemplo, axe-core) más allá
  de las reglas de plantilla de `@angular-eslint`; ver `docs/accessibility.md`.
- Las pruebas end-to-end corren únicamente contra Chromium en esta entrega, no contra Firefox o
  WebKit.
- Ninguna prueba automatizada sustituye una revisión de seguridad manual (ver `docs/security.md`).
