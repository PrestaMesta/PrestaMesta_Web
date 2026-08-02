import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-terms-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './terms-page.html',
})
export class TermsPage {
  constructor() {
    inject(SeoService).updateMetadata({
      description:
        'Términos de uso de PrestaMesta: naturaleza académica del proyecto, alcance de la APK de demostración y límites de responsabilidad.',
      path: '/terminos-de-uso',
    });
  }
}
