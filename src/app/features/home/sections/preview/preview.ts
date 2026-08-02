import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { Icon } from '../../../../shared/components/icon/icon';

type PreviewScreenId = 'inicio' | 'simulacion' | 'calendario' | 'estado' | 'perfil';

interface PreviewScreen {
  readonly id: PreviewScreenId;
  readonly label: string;
}

const SCREENS: readonly PreviewScreen[] = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'simulacion', label: 'Simulación' },
  { id: 'calendario', label: 'Calendario' },
  { id: 'estado', label: 'Estado' },
  { id: 'perfil', label: 'Perfil' },
];

/**
 * Tabbed phone mockup showing fictional app screens. All labels, names and figures are
 * demonstrative — no real screenshots, personal data, or financial figures are involved.
 */
@Component({
  selector: 'app-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './preview.html',
})
export class Preview {
  protected readonly screens = SCREENS;
  protected readonly activeScreen = signal<PreviewScreenId>('inicio');

  selectScreen(id: PreviewScreenId): void {
    this.activeScreen.set(id);
  }
}
