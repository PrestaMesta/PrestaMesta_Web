import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CONTROL_STATUS_LABEL,
  SECURITY_PRINCIPLES,
} from '../../../security-information/models/security-principle.model';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-security',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon, RouterLink],
  templateUrl: './security.html',
})
export class Security {
  protected readonly principles = SECURITY_PRINCIPLES;
  protected readonly statusLabel = CONTROL_STATUS_LABEL;
}
