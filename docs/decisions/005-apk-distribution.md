# 005 — Distribución de la APK de demostración

## Estado

Aceptada

## Fecha

2026-08-02

## Contexto

El proyecto necesita ofrecer una descarga de APK de demostración sin comprometer seguridad: sin
comprometer un archivo binario al repositorio, sin exponer una URL insegura o falsificable, y sin
que el sitio se rompa cuando todavía no exista una APK real que publicar (que es el caso durante
toda esta entrega, ya que no se dispone de un dominio ni de un archivo real).

## Decisión

- La APK **no** se sube al repositorio. La URL de descarga, la versión, el hash SHA-256, la fecha
  de publicación y el tamaño del archivo se leen de `public/config/app-config.json` en tiempo de
  ejecución (ver ADR 006).
- Una función pura (`validateDownloadUrl`, en `features/apk-download/validators/url.validator.ts`)
  decide si la URL configurada es válida: exige HTTPS (permite `http://localhost` solo en
  desarrollo), rechaza credenciales incrustadas, rechaza URLs malformadas, y — cuando es posible —
  la restringe a una lista explícita de hosts permitidos (el dominio del propio sitio, si está
  configurado, y `github.com`, pensado para publicar la APK como GitHub Release).
- Una segunda función pura (`isValidSha256`) valida el formato del hash antes de mostrarlo o de
  permitir copiarlo.
- Cuando la URL o el hash no son válidos (incluyendo el caso por defecto, sin configurar), la
  interfaz muestra un estado "no disponible" explícito en lugar de un enlace roto o un hash vacío.

## Alternativas consideradas

- **Incluir una APK de ejemplo en el repositorio**: descartada explícitamente por el enunciado
  ("No generes una APK falsa dentro del repositorio") y porque no aporta valor real: cualquier APK
  de ejemplo sería falsa por definición.
- **Recibir la URL de descarga por query param**: descartada por ser un vector clásico de
  redirección abierta; la URL siempre proviene de la configuración pública del servidor, nunca de
  la entrada del usuario.
- **Confiar ciegamente en la URL configurada sin validarla**: descartada porque un archivo de
  configuración corrupto o manipulado (por ejemplo, durante un despliegue fallido) no debería
  poder convertirse en un vector de `javascript:`/`data:` ni en un enlace a un host arbitrario.

## Consecuencias positivas

- El sitio funciona correctamente sin ninguna APK configurada (estado seguro por defecto).
- Publicar una versión real solo requiere actualizar el JSON de configuración pública y volver a
  desplegar; no requiere tocar código.
- El hash visible permite a cualquier persona verificar la integridad del archivo antes de
  instalarlo.

## Consecuencias negativas

- La lista de hosts permitidos es una heurística (dominio propio + GitHub); si en el futuro se
  aloja la APK en otro proveedor, `buildAllowedHosts` (en `apk-download.service.ts`) debe
  actualizarse.

## Riesgos

Un archivo de configuración manipulado podría intentar apuntar a un host malicioso; la validación
de host explícita reduce, pero no elimina del todo, este riesgo si el host malicioso coincidiera
con uno de la lista permitida.

## Medidas de mitigación

La configuración pública se sirve desde el mismo origen que la aplicación (no desde un tercero), y
el despliegue en Coolify (ver ADR 008) no expone un mecanismo para que un actor externo modifique
`app-config.json` sin acceso al repositorio o al servidor.
