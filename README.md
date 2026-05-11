# PrestaMesta Web

### Dockerfile.dev

Define la imagen base y los pasos para preparar el entorno de Node.js/Angular dentro del contenedor en modo desarrollo.

    Utiliza una imagen ligera (node:22-alpine o similar compatible con Angular 21).
    Instala las dependencias de manera aislada.
    Expone el puerto 4200 y ejecuta el servidor de desarrollo exponiendo el host hacia afuera (--host 0.0.0.0).

### docker-compose.yml

Orquesta el servicio, mapea el puerto local 4200 con el del contenedor y configura volúmenes para lograr la sincronización en tiempo real (Hot Reload). Gracias a esto, cualquier cambio que guardes en tu editor local se reflejará inmediatamente en el navegador sin necesidad de reiniciar el contenedor.

## Instrucciones de Uso Paso a Paso

### Paso 1: Clonar el repositorio

Abre tu terminal y clona el repositorio (si aún no lo has hecho):

´´´bash
git clone <url-del-repo-presta-mesta-web>
cd presta-mesta-web
´´´

### Paso 2: Construir y levantar el contenedor

Para arrancar el entorno por primera vez (o para reconstruirlo tras añadir nuevas dependencias), ejecuta el siguiente comando en la raíz del proyecto:

´´´bash
docker compose up --build
´´´

Nota: La primera vez tardará unos minutos mientras descarga la imagen base de Node e instala los paquetes definidos en el package.json.

### Paso 3: Acceder a la aplicación

Una vez que la terminal muestre el mensaje de compilación exitosa de Angular, abre tu navegador web e ingresa a:
    http://localhost:4200

### Paso 4: Programar con Hot Reload

¡Listo! Ya puedes abrir el proyecto en tu editor de código. Modifica cualquier archivo .ts, .html o .scss/.css; al guardar los cambios, la página se recargará automáticamente reflejando las actualizaciones.

### Paso 5: Detener el contenedor

Cuando termines de trabajar, puedes detener el servicio presionando Ctrl + C en la terminal donde se está ejecutando, o bien abriendo otra terminal en la misma carpeta y ejecutando:

´´´bash
docker compose down
´´´

## Notas sobre Despliegue y Producción (Coolify / DigitalOcean)

Es importante recordar para las evaluaciones de Arquitectura de Software y Seguridad Informática que esta configuración (Dockerfile.dev y ng serve) está optimizada exclusivamente para el desarrollo local.