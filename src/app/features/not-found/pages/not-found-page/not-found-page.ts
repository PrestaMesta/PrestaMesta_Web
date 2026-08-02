import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-not-found-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './not-found-page.html',
})
export class NotFoundPage {
  constructor() {
    inject(SeoService).updateMetadata({
      description: 'La página que buscas no existe o fue movida.',
      path: '/404',
    });
  }
}
