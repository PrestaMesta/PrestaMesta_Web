# Política de seguridad

PrestaMesta_Web es un proyecto académico y demostrativo. No procesa datos financieros reales, no
otorga préstamos, y no tiene un despliegue de producción público en este momento. Aun así,
agradecemos reportes responsables sobre cualquier problema de seguridad encontrado en el código.

## Cómo reportar una vulnerabilidad

1. **No abras un issue público** para vulnerabilidades de seguridad no divulgadas.
2. Si el repositorio está alojado en GitHub, usa la pestaña **Security → Report a vulnerability**
   (GitHub Security Advisories) para reportarlo de forma privada al equipo mantenedor.
3. Si en el futuro se publica un `contactEmail` en `public/config/app-config.json` (o en el
   footer del sitio desplegado), ese correo es también un canal válido para reportes.
4. Incluye: una descripción del problema, pasos para reproducirlo, y el impacto potencial que
   consideras que tiene.

## Alcance

Está dentro de alcance: el código de este repositorio (frontend Angular, servidor SSR Express,
`Dockerfile`, workflow de CI, y el servidor de referencia en `server/`).

Está fuera de alcance: cualquier despliegue de producción de terceros que use este código sin
relación con este repositorio; ataques que requieran acceso físico a un dispositivo; y problemas
puramente de la infraestructura de terceros (DigitalOcean, Coolify, GitHub) que no se originen en
la configuración de este proyecto.

## Qué esperar

Este es un proyecto académico, no un producto con un equipo de seguridad dedicado ni un SLA de
respuesta garantizado. Se hará el mejor esfuerzo por reconocer el reporte y, si aplica, corregirlo.

## Versiones soportadas

Al ser un proyecto académico de una sola rama principal, solo se da soporte a la última versión de
`main`.
