import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LaunchNotificationService } from '../../services/launch-notification.service';
import { emailFormatValidator, normalizeEmail } from '../../validators/email.validator';

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

const MAX_EMAIL_LENGTH = 254;

@Component({
  selector: 'app-launch-notification-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, FormsModule, RouterLink],
  templateUrl: './launch-notification-form.html',
})
export class LaunchNotificationForm {
  private readonly formBuilder = inject(NonNullableFormBuilder);
  private readonly launchNotification = inject(LaunchNotificationService);

  // Public (not `protected`) so component tests can drive form state and assert on status
  // directly, in addition to the template bindings.
  readonly status = signal<SubmissionStatus>('idle');

  readonly form = this.formBuilder.group({
    email: [
      '',
      [Validators.required, Validators.maxLength(MAX_EMAIL_LENGTH), emailFormatValidator],
    ],
    consent: [false, Validators.requiredTrue],
    // Honeypot: hidden from real users via CSS. Any value here means the submitter is a bot.
    company: [''],
  });

  async onSubmit(): Promise<void> {
    if (this.status() === 'submitting') {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.status.set('submitting');

    const isLikelyBot = this.form.controls.company.value.trim().length > 0;

    try {
      if (!isLikelyBot) {
        await this.launchNotification.submit(normalizeEmail(this.form.controls.email.value));
      }
      this.status.set('success');
    } catch {
      this.status.set('error');
    }
  }
}
