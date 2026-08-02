# Modelo de amenazas (STRIDE) — PrestaMesta_Web

## Escala de riesgo

Se usa una escala simple de tres niveles, calculada como `Probabilidad × Impacto`:

| Probabilidad \ Impacto | Bajo  | Medio | Alto  |
| ---------------------- | ----- | ----- | ----- |
| **Baja**               | Bajo  | Bajo  | Medio |
| **Media**              | Bajo  | Medio | Alto  |
| **Alta**               | Medio | Alto  | Alto  |

- **Bajo**: aceptar el riesgo o mitigar de forma oportunista.
- **Medio**: mitigar con una medida concreta antes de un lanzamiento real.
- **Alto**: debe mitigarse antes de exponer la funcionalidad correspondiente.

Categorías STRIDE: **S**poofing, **T**ampering, **R**epudiation, **I**nformation disclosure,
**D**enial of service, **E**levation of privilege.

---

### 1. Suplantación del sitio (phishing con un dominio similar)

- **Categoría**: Spoofing
- **Activo**: confianza de la persona usuaria en el dominio oficial
- **Actor**: atacante externo registrando un dominio parecido
- **Vector**: dominio typosquatting sirviendo una copia visual del sitio
- **Probabilidad**: Media · **Impacto**: Medio · **Riesgo**: Medio
- **Mitigaciones**: el aviso de instalación recuerda instalar la APK solo desde el sitio oficial;
  el hash SHA-256 permite verificar la integridad del archivo independientemente del dominio desde
  el que se descargó.
- **Riesgo residual**: Bajo–Medio (depende de que la persona usuaria efectivamente verifique el
  hash).
- **Responsable**: equipo de comunicación/marketing del proyecto (fuera del alcance de este
  repositorio).

### 2. Phishing dirigido a los interesados del formulario

- **Categoría**: Spoofing
- **Activo**: correos electrónicos de personas interesadas
- **Actor**: atacante con acceso a una lista de correos filtrada
- **Vector**: correos falsos suplantando a PrestaMesta
- **Probabilidad**: Baja (el formulario no almacena correos hoy) · **Impacto**: Medio ·
  **Riesgo**: Bajo
- **Mitigaciones**: el formulario opera en modo de demostración; no existe ninguna lista de
  correos que filtrar.
- **Riesgo residual**: Bajo. Si se activa un backend real en el futuro, este riesgo debe
  reevaluarse (ver ADR 007).
- **Responsable**: quien active el backend real, si llega a implementarse.

### 3. Manipulación del enlace de descarga

- **Categoría**: Tampering
- **Activo**: URL de descarga de la APK
- **Actor**: atacante que logra modificar la configuración pública o interceptar la respuesta
- **Vector**: modificar `app-config.json` en el servidor, o un ataque de intermediario sin HTTPS
- **Probabilidad**: Baja · **Impacto**: Alto · **Riesgo**: Medio
- **Mitigaciones**: HTTPS obligatorio en producción (Traefik); validación de URL (protocolo,
  host permitido, sin credenciales embebidas); el hash SHA-256 permite detectar cualquier
  sustitución del archivo final, incluso si la URL fue manipulada.
- **Riesgo residual**: Bajo, siempre que la persona usuaria verifique el hash.
- **Responsable**: administrador del despliegue (acceso a Coolify/al servidor).

### 4. Sustitución maliciosa de la APK en el origen de descarga

- **Categoría**: Tampering
- **Activo**: el archivo APK en sí
- **Actor**: atacante con acceso al servidor/proveedor donde se aloja la APK (por ejemplo, una
  cuenta de GitHub comprometida)
- **Vector**: reemplazar el archivo publicado por una versión maliciosa
- **Probabilidad**: Baja · **Impacto**: Alto · **Riesgo**: Medio
- **Mitigaciones**: el hash SHA-256 publicado en el sitio permite detectar cualquier archivo que
  no coincida exactamente con el original.
- **Riesgo residual**: Medio si la persona usuaria no verifica el hash (fuera del control del
  código de este repositorio).
- **Responsable**: quien administra el origen de la APK (GitHub Releases u otro).

### 5. Modificación del archivo de configuración pública

- **Categoría**: Tampering
- **Activo**: `public/config/app-config.json`
- **Actor**: atacante con acceso de escritura al servidor o al pipeline de despliegue
- **Vector**: modificar valores para apuntar a una URL o un hash falsos
- **Probabilidad**: Baja · **Impacto**: Medio · **Riesgo**: Bajo
- **Mitigaciones**: `parseAppConfig` descarta propiedades inesperadas; la validación de host
  limita a qué dominios puede apuntar la URL de descarga incluso si el archivo fue alterado.
- **Riesgo residual**: Bajo.
- **Responsable**: administrador del despliegue.

### 6. Cross-Site Scripting (XSS)

- **Categoría**: Tampering / Elevation of privilege
- **Activo**: sesión del navegador de la persona usuaria
- **Actor**: atacante que logre inyectar HTML/JS
- **Vector**: cualquier punto donde se muestre contenido sin escapar
- **Probabilidad**: Baja · **Impacto**: Alto · **Riesgo**: Medio
- **Mitigaciones**: Angular escapa todo el enlace de datos por defecto; no se usa `innerHTML` ni
  `bypassSecurityTrust*` en ningún componente; CSP estricta (`script-src 'self'`, sin
  `unsafe-inline`) reduce el impacto incluso si se colara una inyección.
- **Riesgo residual**: Bajo.
- **Responsable**: cualquier persona que modifique plantillas de Angular en el futuro (revisar en
  code review).

### 7. Inyección en formularios

- **Categoría**: Tampering
- **Activo**: integridad del formulario de novedades
- **Actor**: atacante enviando payloads maliciosos en el campo de correo
- **Vector**: bypass del formulario mediante peticiones directas (sin backend real, este vector no
  tiene a dónde ir hoy)
- **Probabilidad**: Baja (no hay backend que reciba el payload) · **Impacto**: Bajo ·
  **Riesgo**: Bajo
- **Mitigaciones**: validación de formato y longitud en el cliente; el servidor de referencia en
  `server/` valida también del lado del servidor, para cuando se active.
- **Riesgo residual**: Bajo.
- **Responsable**: quien active el backend real.

### 8. Spam / abuso del formulario

- **Categoría**: Denial of service (de recursos, no de disponibilidad)
- **Activo**: bandeja de interesados (si existiera)
- **Actor**: bots automatizados
- **Vector**: envíos masivos automatizados
- **Probabilidad**: Baja hoy (no hay backend) · **Impacto**: Bajo · **Riesgo**: Bajo
- **Mitigaciones**: campo honeypot invisible; el servidor de referencia incluye rate limiting.
- **Riesgo residual**: Bajo.
- **Responsable**: quien active el backend real.

### 9. Bots automatizados explorando el sitio

- **Categoría**: Denial of service / Information disclosure
- **Activo**: disponibilidad del servidor
- **Actor**: scrapers o bots de fuerza bruta
- **Vector**: peticiones automatizadas masivas
- **Probabilidad**: Media · **Impacto**: Bajo · **Riesgo**: Bajo
- **Mitigaciones**: `robots.txt`; el servidor de referencia documenta rate limiting; Traefik puede
  configurarse con límites adicionales a nivel de proxy.
- **Riesgo residual**: Bajo.
- **Responsable**: administrador del despliegue.

### 10. Filtración de correos electrónicos

- **Categoría**: Information disclosure
- **Activo**: correos de personas interesadas
- **Actor**: cualquiera con acceso a un almacenamiento comprometido
- **Vector**: una base de datos o log expuestos
- **Probabilidad**: Baja (no existe almacenamiento hoy) · **Impacto**: Alto (si existiera) ·
  **Riesgo**: Bajo hoy
- **Mitigaciones**: modo de demostración — no hay nada que filtrar. Si se activa un backend real,
  el ADR 007 y el aviso de privacidad deben actualizarse con la política de retención real.
- **Riesgo residual**: Bajo hoy; a reevaluar si cambia.
- **Responsable**: quien active el backend real.

### 11. Exposición de secretos en el repositorio o en el bundle

- **Categoría**: Information disclosure
- **Activo**: credenciales, tokens, claves privadas
- **Actor**: cualquiera con acceso al repositorio público o al bundle servido
- **Vector**: un secreto incluido por error en el código, en `environment.ts`, o en
  `app-config.json`
- **Probabilidad**: Baja · **Impacto**: Alto · **Riesgo**: Medio
- **Mitigaciones**: no existen archivos `environment.ts` con datos sensibles; `app-config.json`
  solo contiene valores intencionalmente públicos; escaneo de secretos en CI
  (`.github/workflows/ci.yml`); `.env.example` documenta qué variables usaría el servidor de
  referencia sin incluir valores reales.
- **Riesgo residual**: Bajo.
- **Responsable**: cualquier persona que haga commits al repositorio.

### 12. Dependencias comprometidas (supply chain)

- **Categoría**: Tampering
- **Activo**: la cadena de build completa
- **Actor**: un paquete de npm comprometido (propio o transitivo)
- **Vector**: una actualización maliciosa de una dependencia
- **Probabilidad**: Baja · **Impacto**: Alto · **Riesgo**: Medio
- **Mitigaciones**: `package-lock.json` fija versiones exactas; `npm ci` (no `npm install`) en CI y
  en el build de Docker; `npm audit` en CI; número mínimo de dependencias de terceros.
- **Riesgo residual**: Medio (inherente a cualquier proyecto con dependencias de npm).
- **Responsable**: quien revise y apruebe actualizaciones de dependencias.

### 13. Clickjacking

- **Categoría**: Tampering / Spoofing
- **Activo**: acciones de la persona usuaria (por ejemplo, el formulario)
- **Actor**: sitio malicioso embebiendo PrestaMesta en un `<iframe>` invisible
- **Vector**: iframe superpuesto engañando a la persona usuaria para hacer clic
- **Probabilidad**: Baja · **Impacto**: Medio · **Riesgo**: Bajo
- **Mitigaciones**: `X-Frame-Options: DENY` y `frame-ancestors 'none'` en la CSP.
- **Riesgo residual**: Muy bajo.
- **Responsable**: N/A (control ya implementado).

### 14. Redirecciones abiertas

- **Categoría**: Tampering
- **Activo**: confianza en los enlaces de PrestaMesta
- **Actor**: atacante intentando usar el sitio como redirector hacia un destino malicioso
- **Vector**: un parámetro de query controlando a dónde navega el sitio
- **Probabilidad**: Baja · **Impacto**: Medio · **Riesgo**: Bajo
- **Mitigaciones**: ninguna navegación del sitio depende de parámetros de query; la URL de la APK
  siempre proviene de la configuración del servidor, nunca de la URL visitada por la persona
  usuaria.
- **Riesgo residual**: Muy bajo.
- **Responsable**: N/A (control ya implementado).

### 15. Denegación de servicio básica (volumen de tráfico)

- **Categoría**: Denial of service
- **Activo**: disponibilidad del sitio
- **Actor**: tráfico masivo, malicioso o no
- **Vector**: inundación de peticiones
- **Probabilidad**: Baja (sitio de bajo perfil) · **Impacto**: Medio · **Riesgo**: Bajo
- **Mitigaciones**: contenido mayormente prerenderizado (barato de servir); Traefik puede
  configurarse con límites de tasa a nivel de proxy; el servidor de referencia documenta rate
  limiting para su propia API.
- **Riesgo residual**: Bajo–Medio (mitigación completa requeriría un WAF/CDN dedicado, fuera de
  alcance).
- **Responsable**: administrador del despliegue.

### 16. Ingeniería social durante la instalación de la APK

- **Categoría**: Spoofing
- **Activo**: dispositivo de la persona usuaria
- **Actor**: atacante distribuyendo una APK falsa por otros canales (redes sociales, mensajería)
- **Vector**: convencer a la persona de instalar un archivo que no proviene del sitio oficial
- **Probabilidad**: Media · **Impacto**: Alto · **Riesgo**: Alto
- **Mitigaciones**: advertencias explícitas en la sección de descarga sobre instalar solo desde el
  sitio oficial y verificar el hash; FAQ dedicada a este tema.
- **Riesgo residual**: Medio–Alto (depende en gran medida del comportamiento de la persona
  usuaria, fuera del control del código).
- **Responsable**: comunicación del proyecto (recordar activamente el canal oficial).

### 17. Configuración CORS incorrecta

- **Categoría**: Elevation of privilege / Information disclosure
- **Activo**: API de novedades (si se activa el servidor de referencia)
- **Actor**: un sitio de terceros haciendo peticiones no autorizadas
- **Vector**: una política CORS demasiado permisiva (`*` con credenciales, por ejemplo)
- **Probabilidad**: Baja (la API no está activa hoy) · **Impacto**: Medio · **Riesgo**: Bajo
- **Mitigaciones**: el servidor de referencia en `server/` documenta una configuración CORS
  restrictiva (origen explícito, no comodín) como parte de su diseño.
- **Riesgo residual**: Bajo.
- **Responsable**: quien active el backend real.

### 18. Manipulación de las respuestas del endpoint

- **Categoría**: Tampering
- **Activo**: integridad de las respuestas de la API de novedades
- **Actor**: atacante en una posición de intermediario sin HTTPS
- **Vector**: modificar la respuesta en tránsito
- **Probabilidad**: Baja (no hay API activa hoy; HTTPS obligatorio en producción) ·
  **Impacto**: Bajo · **Riesgo**: Bajo
- **Mitigaciones**: HTTPS obligatorio en producción.
- **Riesgo residual**: Muy bajo.
- **Responsable**: administrador del despliegue.

### 19. Publicación de hashes falsos

- **Categoría**: Spoofing / Tampering
- **Activo**: confianza en el mecanismo de verificación de integridad
- **Actor**: atacante que logra publicar un hash que coincide con una APK maliciosa
- **Vector**: comprometer el propio `app-config.json` (ver amenaza 5) para publicar el hash del
  archivo malicioso junto con su URL
- **Probabilidad**: Baja · **Impacto**: Alto · **Riesgo**: Medio
- **Mitigaciones**: las mismas que la amenaza 5 (control de acceso al despliegue); se documenta
  explícitamente que "el hash solo aporta confianza si se publica desde una fuente legítima y
  protegida" en la sección de descarga.
- **Riesgo residual**: Medio (el hash por sí solo no protege contra un atacante que controle tanto
  el archivo como la publicación del hash).
- **Responsable**: administrador del despliegue.

---

## Resumen de riesgos por nivel

| Riesgo    | Amenazas                                             |
| --------- | ---------------------------------------------------- |
| **Alto**  | #16 Ingeniería social en la instalación              |
| **Medio** | #3, #4, #6, #11, #12, #19                            |
| **Bajo**  | #1, #2, #5, #7, #8, #9, #10, #13, #14, #15, #17, #18 |
