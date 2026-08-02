import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Icon, IconName } from '../../../../shared/components/icon/icon';

interface Benefit {
  readonly icon: IconName;
  readonly title: string;
  readonly description: string;
}

const BENEFITS: readonly Benefit[] = [
  {
    icon: 'check-circle',
    title: 'Proceso sencillo',
    description:
      'Solicita y da seguimiento a tus consultas de préstamo sin trámites confusos ni pasos innecesarios.',
  },
  {
    icon: 'file-check',
    title: 'Información clara',
    description:
      'Conoce condiciones, montos y plazos presentados de forma simple, sin letras pequeñas.',
  },
  {
    icon: 'smartphone',
    title: 'Seguimiento desde tu teléfono',
    description:
      'Consulta el estado de tu solicitud y tus próximos pagos desde la aplicación, cuando lo necesites.',
  },
  {
    icon: 'lock',
    title: 'Protección de tus datos',
    description:
      'Aplicamos principios de privacidad por diseño y minimización de datos en cada solicitud.',
  },
  {
    icon: 'clock',
    title: 'Experiencia rápida',
    description:
      'Una interfaz ligera y directa, pensada para encontrar lo que buscas sin fricciones.',
  },
  {
    icon: 'headset',
    title: 'Soporte accesible',
    description:
      'Un diseño que funciona con teclado y lectores de pantalla, para que cualquier persona pueda usarlo.',
  },
];

@Component({
  selector: 'app-benefits',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './benefits.html',
})
export class Benefits {
  protected readonly benefits = BENEFITS;
}
