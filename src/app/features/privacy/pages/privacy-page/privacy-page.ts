import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-privacy-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './privacy-page.html',
})
export class PrivacyPage {
  constructor() {
    inject(SeoService).updateMetadata({
      description:
        'Aviso de privacidad de PrestaMesta: qué datos se solicitan, para qué se usarían y qué ocurre en el modo de demostración.',
      path: '/aviso-de-privacidad',
    });
  }
}
