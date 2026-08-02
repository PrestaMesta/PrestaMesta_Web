import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SeoService } from '../../../../core/services/seo.service';
import { ApkDownloadSection } from '../../../apk-download/components/apk-download-section/apk-download-section';
import { Benefits } from '../../sections/benefits/benefits';
import { Faq } from '../../sections/faq/faq';
import { Hero } from '../../sections/hero/hero';
import { LaunchNotificationForm } from '../../../launch-notification/components/launch-notification-form/launch-notification-form';
import { HowItWorks } from '../../sections/how-it-works/how-it-works';
import { Preview } from '../../sections/preview/preview';
import { Security } from '../../sections/security/security';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Hero,
    Benefits,
    HowItWorks,
    Preview,
    Security,
    ApkDownloadSection,
    LaunchNotificationForm,
    Faq,
  ],
  templateUrl: './home-page.html',
})
export class HomePage {
  constructor() {
    inject(SeoService).updateMetadata({
      description:
        'PrestaMesta es un proyecto académico y demostrativo: consulta y administra préstamos personales desde tu teléfono con una experiencia simple, rápida y transparente.',
      path: '/',
    });
  }
}
