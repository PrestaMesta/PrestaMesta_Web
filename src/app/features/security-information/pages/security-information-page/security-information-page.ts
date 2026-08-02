import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SeoService } from '../../../../core/services/seo.service';
import { Icon } from '../../../../shared/components/icon/icon';
import { CONTROL_STATUS_LABEL, SECURITY_PRINCIPLES } from '../../models/security-principle.model';

@Component({
  selector: 'app-security-information-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './security-information-page.html',
})
export class SecurityInformationPage {
  protected readonly principles = SECURITY_PRINCIPLES;
  protected readonly statusLabel = CONTROL_STATUS_LABEL;

  constructor() {
    inject(SeoService).updateMetadata({
      description:
        'Cómo aborda PrestaMesta la seguridad: controles implementados en el sitio, propuestas para la app móvil y qué dependería de un backend futuro.',
      path: '/seguridad',
    });
  }
}
