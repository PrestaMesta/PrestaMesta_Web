# 007 — Backend del formulario de novedades

## Estado

Aceptada

## Fecha

2026-08-02

## Contexto

El formulario de "Entérate cuando haya novedades" solo pide un correo electrónico. El enunciado
permite que, si el formulario requiere persistencia real, se construya una API mínima y separada
(Node/Express, función serverless, o servicio independiente), pero también exige que, cuando no
exista un servicio real configurado, el formulario funcione en modo de demostración, sin almacenar
ni enviar nada.

Para esta entrega no existe un servidor de backend desplegado, ni una base de datos, ni una
necesidad real de almacenar correos (es un proyecto académico, no un producto en lanzamiento).

## Decisión

- El frontend (`LaunchNotificationService`) siempre opera en modo de demostración: simula una
  espera de red y resuelve exitosamente, sin llamar a ningún endpoint real ni almacenar el correo
  en ningún lugar. La interfaz lo comunica explícitamente al usuario.
- Se incluye, como referencia arquitectónica separada, un servidor Express mínimo en `server/`
  (validación de entrada, honeypot, límite de tasa, CORS restrictivo, errores genéricos, tiempo de
  espera, configuración por variables de entorno) que demuestra cómo se vería una implementación
  real. **No** está conectado al build de Angular, al servidor de producción, ni al pipeline de
  CI: es documentación ejecutable, no parte del despliegue por defecto.
- No se implementa ninguna base de datos.

## Alternativas consideradas

- **Conectar el formulario a un servicio de terceros (por ejemplo, un formulario de Google o un
  proveedor de email marketing)**: descartada porque introduciría una dependencia y una
  transferencia de datos a un tercero sin que exista una necesidad real ni el consentimiento
  explícito que eso implicaría documentar.
- **Desplegar el servidor de referencia junto con el frontend**: descartada para esta entrega
  porque añadiría una pieza más de infraestructura (proceso adicional, variables de entorno,
  posible base de datos) sin un beneficio real, dado que no hay destinatarios reales para esos
  correos.

## Consecuencias positivas

- Cero riesgo de fuga de correos electrónicos: nunca se envían a ningún servidor.
- El repositorio incluye igualmente un ejemplo completo y funcional (aunque no desplegado) de cómo
  se implementaría el backend real, con las prácticas de seguridad que pide el enunciado
  (validación server-side, honeypot, rate limiting, CORS, manejo de errores, límite de tamaño del
  cuerpo).

## Consecuencias negativas

- El formulario no tiene ningún efecto real más allá de la demostración de la interfaz; no genera
  una lista de interesados real.

## Riesgos

Ninguno de seguridad: al no existir transmisión ni almacenamiento real de datos, no hay superficie
de ataque asociada a este formulario en la versión desplegada.

## Medidas de mitigación

No aplica; si en el futuro se decide activar el backend real, el ADR debería actualizarse (o
crearse uno nuevo) documentando esa transición y el proceso de retención/eliminación de datos que
correspondería añadir al aviso de privacidad.
