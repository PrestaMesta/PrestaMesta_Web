import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Icon, IconName } from '../../../../shared/components/icon/icon';

interface Step {
  readonly icon: IconName;
  readonly title: string;
  readonly description: string;
}

const STEPS: readonly Step[] = [
  {
    icon: 'download',
    title: 'Descarga la aplicación',
    description:
      'Obtén la versión de demostración desde este sitio y sigue las instrucciones de instalación.',
  },
  {
    icon: 'user',
    title: 'Crea tu perfil',
    description: 'Configura tu perfil dentro de la aplicación para personalizar tu experiencia.',
  },
  {
    icon: 'search',
    title: 'Consulta las opciones disponibles',
    description: 'Explora de forma clara las opciones y condiciones antes de decidir.',
  },
  {
    icon: 'smartphone',
    title: 'Administra tu préstamo',
    description: 'Da seguimiento a tu solicitud y a tus pagos directamente desde tu teléfono.',
  },
];

@Component({
  selector: 'app-how-it-works',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './how-it-works.html',
})
export class HowItWorks {
  protected readonly steps = STEPS;
}
