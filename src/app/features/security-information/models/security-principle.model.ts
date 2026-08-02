import { IconName } from '../../../shared/components/icon/icon';

export type ControlStatus = 'implementado' | 'propuesto' | 'backend';

export interface SecurityPrinciple {
  readonly icon: IconName;
  readonly title: string;
  readonly summary: string;
  readonly detail: string;
  readonly status: ControlStatus;
}

export const CONTROL_STATUS_LABEL: Record<ControlStatus, string> = {
  implementado: 'Implementado en este sitio',
  propuesto: 'Propuesto para la app móvil',
  backend: 'Dependería de un backend futuro',
};

export const SECURITY_PRINCIPLES: readonly SecurityPrinciple[] = [
  {
    icon: 'lock',
    title: 'Cifrado en tránsito (HTTPS)',
    summary: 'El sitio se sirve mediante HTTPS, con TLS terminado en el proxy de despliegue.',
    detail:
      'En producción, el tráfico llega a través de un proxy (Traefik, gestionado por Coolify) que termina TLS y fuerza HTTPS. El servidor de la aplicación nunca recibe tráfico HTTP directo desde internet.',
    status: 'implementado',
  },
  {
    icon: 'check-circle',
    title: 'Validación de entradas',
    summary: 'Formularios y utilidades de configuración validan el formato antes de usarlo.',
    detail:
      'El formulario de novedades valida formato de correo y longitud máxima con Reactive Forms. La URL de descarga de la APK y su hash se validan con funciones puras antes de mostrarse o usarse.',
    status: 'implementado',
  },
  {
    icon: 'shield-check',
    title: 'Codificación segura de salidas',
    summary:
      'Se usa el enlace de datos de Angular; no se usa innerHTML ni se desactiva su saneamiento.',
    detail:
      'Todo el contenido dinámico pasa por el enlace de datos estándar de Angular, que escapa el contenido automáticamente. No se usa innerHTML, outerHTML, ni las APIs bypassSecurityTrust*.',
    status: 'implementado',
  },
  {
    icon: 'user',
    title: 'Privacidad por diseño',
    summary: 'Solo se solicita el correo electrónico; nada de datos financieros o de identidad.',
    detail:
      'El único dato personal solicitado en todo el sitio es un correo electrónico opcional. No se piden CURP, identificaciones, domicilios, ingresos ni datos bancarios.',
    status: 'implementado',
  },
  {
    icon: 'lock',
    title: 'Mínimo privilegio',
    summary: 'El contenedor de producción corre con un usuario sin privilegios de root.',
    detail:
      'La imagen Docker de producción ejecuta el proceso Node/Express con un usuario sin privilegios administrativos, y expone solo el puerto necesario para el proxy interno.',
    status: 'implementado',
  },
  {
    icon: 'file-check',
    title: 'Gestión segura de configuración',
    summary: 'La configuración pública se valida y nunca incluye secretos ni credenciales.',
    detail:
      'El archivo público de configuración se analiza con una función pura que descarta propiedades inesperadas y aplica valores por defecto seguros. Los secretos, si existieran, vivirían únicamente como variables de entorno del servidor, nunca en el bundle.',
    status: 'implementado',
  },
  {
    icon: 'alert-triangle',
    title: 'Protección frente a entradas maliciosas',
    summary:
      'Un filtrado más profundo (límites de tasa, reglas de un WAF) depende de la infraestructura de producción real.',
    detail:
      'Esta entrega valida formato en el cliente, pero un filtrado robusto contra abuso a gran escala requeriría límites de tasa y reglas a nivel de proxy/infraestructura, fuera del alcance de una landing page académica.',
    status: 'propuesto',
  },
  {
    icon: 'shield-check',
    title: 'Actualizaciones verificables',
    summary: 'Cada versión publicada de la APK se acompaña de su hash, para poder verificarla.',
    detail:
      'La sección de descarga muestra la versión y el hash SHA-256 asociado, para que cualquier persona pueda confirmar que el archivo que descargó corresponde a la versión publicada.',
    status: 'implementado',
  },
  {
    icon: 'check-circle',
    title: 'Integridad de la APK',
    summary: 'El hash SHA-256 mostrado permite confirmar que el archivo no fue alterado.',
    detail:
      'El hash solo se muestra si tiene un formato válido (64 caracteres hexadecimales). Instrucciones para generarlo en Linux, macOS y Windows están disponibles junto al botón de descarga.',
    status: 'implementado',
  },
  {
    icon: 'user',
    title: 'Minimización de datos',
    summary: 'Solo se recopila lo estrictamente necesario para el propósito declarado.',
    detail:
      'Ningún formulario de este sitio solicita más datos de los necesarios para su propósito puntual: el correo electrónico es el único dato personal recolectado, y solo con fines de aviso.',
    status: 'implementado',
  },
  {
    icon: 'alert-triangle',
    title: 'Gestión segura de errores',
    summary: 'Los errores se muestran de forma genérica, sin trazas técnicas ni detalles internos.',
    detail:
      'Los mensajes de error visibles para la persona usuaria son genéricos y no exponen trazas de pila, rutas del servidor ni detalles de configuración interna.',
    status: 'implementado',
  },
  {
    icon: 'lock',
    title: 'Sin contraseñas en texto plano',
    summary:
      'Aún no hay autenticación con contraseña; de existir, requeriría un backend con hash seguro.',
    detail:
      'Este sitio no implementa inicio de sesión. Si en el futuro se añadiera autenticación, las contraseñas deberían almacenarse únicamente como hashes (por ejemplo con Argon2 o bcrypt) en un backend dedicado, nunca en el frontend ni en texto plano.',
    status: 'backend',
  },
];
