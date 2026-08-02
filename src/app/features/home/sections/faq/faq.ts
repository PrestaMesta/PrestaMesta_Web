import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Icon } from '../../../../shared/components/icon/icon';

interface FaqItem {
  readonly question: string;
  readonly answer: string;
}

const FAQ_ITEMS: readonly FaqItem[] = [
  {
    question: '¿Qué es PrestaMesta?',
    answer:
      'Es un proyecto académico y demostrativo de una aplicación móvil para consultar y administrar préstamos personales de forma simple y transparente.',
  },
  {
    question: '¿La aplicación ya está disponible?',
    answer:
      'Por ahora existe una versión de demostración para Android mediante un archivo APK. No hay versión pública en Google Play ni en App Store todavía.',
  },
  {
    question: '¿Dónde puedo descargar la APK?',
    answer:
      'Desde la sección "Descargar APK" de esta página, únicamente cuando exista una versión configurada y publicada de forma oficial.',
  },
  {
    question: '¿Es seguro instalar la APK?',
    answer:
      'Instálala solo desde este sitio oficial y verifica su hash SHA-256 antes de abrirla. Evita fuentes de terceros no verificadas.',
  },
  {
    question: '¿Cómo verifico la integridad de la APK?',
    answer:
      'Genera el hash SHA-256 del archivo descargado y compáralo con el que se publica en esta página; deben coincidir exactamente.',
  },
  {
    question: '¿Cuándo llegará a Google Play?',
    answer: 'Aún no hay una fecha definida. La sección de tiendas indica "Próximamente".',
  },
  {
    question: '¿Cuándo llegará a App Store?',
    answer: 'Tampoco hay una fecha definida para esta tienda; se indicará aquí cuando exista.',
  },
  {
    question: '¿PrestaMesta otorga préstamos reales?',
    answer:
      'No. Esta es una demostración académica; no se procesan solicitudes de crédito reales ni transferencias de dinero.',
  },
  {
    question: '¿Qué permisos solicitará la aplicación?',
    answer:
      'Aún está en definición. Se seguirá el principio de mínimo privilegio, solicitando solo lo estrictamente necesario.',
  },
  {
    question: '¿Mis datos serán almacenados?',
    answer:
      'El formulario de esta página funciona en modo de demostración: no almacena tu correo en ningún servidor.',
  },
  {
    question: '¿Qué significa que sea una versión demostrativa?',
    answer:
      'Que el contenido, las pantallas y los flujos existen con fines educativos y de diseño, no como un producto financiero terminado.',
  },
];

@Component({
  selector: 'app-faq',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './faq.html',
})
export class Faq {
  protected readonly items = FAQ_ITEMS;
}
