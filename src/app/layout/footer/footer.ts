import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppConfigService } from '../../core/config/app-config.service';
import { Logo } from '../../shared/components/logo/logo';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Logo],
  templateUrl: './footer.html',
})
export class Footer {
  private readonly appConfig = inject(AppConfigService);

  protected readonly config = this.appConfig.config;
  protected readonly currentYear = new Date().getFullYear();
}
