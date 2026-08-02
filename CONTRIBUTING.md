# Contribuir a PrestaMesta_Web

Gracias por tu interés. Este es un proyecto académico; estas pautas buscan mantener el código
consistente y fácil de revisar.

## Antes de empezar

1. Lee `docs/architecture.md` para entender cómo está organizado el proyecto (arquitectura por
   características, `core`/`shared`/`layout`/`features`).
2. Lee `docs/security.md` y las secciones de "Evita" del `CLAUDE.md` del repositorio antes de
   tocar cualquier código relacionado con seguridad, formularios, o la descarga de la APK.

## Flujo de trabajo

```bash
npm ci
npm start          # servidor de desarrollo
npm run lint
npm run format:check
npm test
npm run test:e2e
npm run build
```

Todos estos comandos deben pasar antes de abrir un pull request. El pipeline de CI
(`.github/workflows/ci.yml`) ejecuta los mismos pasos.

## Estilo de código

- Prettier (`prettier.config.js`) y ESLint (`eslint.config.js`) son la fuente de verdad de estilo;
  no discutas formato en code review, corre `npm run format`.
- Componentes standalone, `ChangeDetectionStrategy.OnPush`, Signals para estado local, sin
  NgModules (ver ADR [002](docs/decisions/002-standalone-components.md)).
- Nada de `innerHTML`, `bypassSecurityTrust*`, `eval`, ni construcción dinámica de URLs a partir de
  entradas de usuario. Ver `docs/security.md`.
- Funciones puras para validación/transformación cuando sea posible — facilita probarlas sin
  `TestBed` (ver `docs/testing.md`).

## Añadir una funcionalidad nueva

- Componentes y lógica específicos de una característica van en
  `src/app/features/<nombre>/{components,pages,services,models,validators}`.
- Solo lo verdaderamente reutilizable entre características va en `src/app/shared`.
- Si la funcionalidad introduce una decisión de arquitectura no trivial, documenta un nuevo ADR en
  `docs/decisions/`, siguiendo el formato de los existentes.

## Reportar bugs o proponer cambios

Abre un issue describiendo el problema o la propuesta. Para vulnerabilidades de seguridad, sigue
`SECURITY.md` en lugar de abrir un issue público.

## Licencia

Al contribuir, aceptas que tu contribución se distribuya bajo la misma licencia del repositorio
(ver `LICENSE`).
