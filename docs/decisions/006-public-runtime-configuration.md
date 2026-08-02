# 006 — Configuración pública en tiempo de ejecución

## Estado

Aceptada

## Fecha

2026-08-02

## Contexto

Algunos valores (URL de descarga de la APK, su hash, versión, correo de contacto, URL del sitio,
URL de GitHub) deben poder cambiar sin tener que recompilar la aplicación (por ejemplo, publicar
una nueva versión de la APK). Al mismo tiempo, nada de esto debe convertirse en una forma de
filtrar secretos: todo lo que llega al bundle de Angular, o a un archivo servido públicamente, es
por definición público.

## Decisión

- `public/config/app-config.json` es un archivo JSON servido tal cual (assets estáticos), leído
  por `AppConfigService` mediante `HttpClient` al iniciar la aplicación (usando
  `provideAppInitializer`, para que la configuración esté disponible antes de que la interfaz se
  renderice).
- Una función pura (`parseAppConfig`) transforma la respuesta HTTP en un `AppPublicConfig`
  totalmente tipado: cualquier propiedad ausente, de tipo incorrecto, vacía o inesperada cae a un
  valor por defecto seguro (cadena vacía), en lugar de propagar `undefined` o lanzar una
  excepción.
- El archivo de ejemplo que se distribuye con el repositorio tiene todos los campos vacíos: no se
  inventa ningún dominio, correo o URL reales (ver la sección de configuración en `README.md`).
- El token `APP_CONFIG` expone el valor ya cargado y validado como un objeto de solo lectura para
  quien prefiera inyectarlo directamente en lugar de usar el servicio.

## Alternativas consideradas

- **Variables de entorno de Angular (`environment.ts`)**: descartadas para estos valores porque se
  incrustan en el bundle en tiempo de compilación; cambiar la URL de la APK obligaría a
  recompilar y volver a desplegar toda la aplicación. Además, el enunciado pide explícitamente que
  `environment.ts` nunca contenga secretos, y mezclar configuración pública variable con
  configuración de compilación puede llevar a confundir ambos conceptos.
- **Endpoint de API para la configuración**: hubiera requerido un backend adicional solo para
  servir un JSON estático; no aporta nada sobre servir el archivo directamente como asset público.

## Consecuencias positivas

- Cambiar la versión, el hash o la URL de la APK es una operación de despliegue de un archivo
  estático, no de recompilación.
- La aplicación nunca se rompe por un archivo de configuración ausente o corrupto: siempre hay un
  estado por defecto seguro.

## Consecuencias negativas

- Cualquier valor en `app-config.json` es público por diseño; nunca puede usarse para algo que
  deba mantenerse privado (tokens, credenciales, claves de API).

## Riesgos

Si alguien colocara un secreto en este archivo por error, quedaría expuesto públicamente sin
ninguna protección adicional, ya que se sirve como un asset estático sin autenticación.

## Medidas de mitigación

`parseAppConfig` solo copia las ocho propiedades conocidas de `AppPublicConfig`; cualquier otra
propiedad se descarta silenciosamente, lo que limita (aunque no elimina) el impacto de agregar
algo por error a este archivo. El escaneo de secretos en CI (ver `.github/workflows/ci.yml`)
también cubre este archivo.
