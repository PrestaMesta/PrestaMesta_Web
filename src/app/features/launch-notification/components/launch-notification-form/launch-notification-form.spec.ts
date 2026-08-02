import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LaunchNotificationService } from '../../services/launch-notification.service';
import { LaunchNotificationForm } from './launch-notification-form';

describe('LaunchNotificationForm', () => {
  let submit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    submit = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({
      imports: [LaunchNotificationForm],
      providers: [provideRouter([]), { provide: LaunchNotificationService, useValue: { submit } }],
    });
  });

  function createInstance() {
    const fixture = TestBed.createComponent(LaunchNotificationForm);
    fixture.detectChanges();
    return fixture;
  }

  it('shows a required error after an empty email is touched and submitted', async () => {
    const fixture = createInstance();
    const component = fixture.componentInstance;

    component.form.controls.email.markAsTouched();
    component.form.controls.consent.setValue(true);
    await component.onSubmit();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Ingresa tu correo electrónico');
    expect(submit).not.toHaveBeenCalled();
  });

  it('submits successfully with a valid email and accepted consent', async () => {
    const fixture = createInstance();
    const component = fixture.componentInstance;

    component.form.setValue({ email: 'demo@example.com', consent: true, company: '' });
    await component.onSubmit();
    fixture.detectChanges();

    expect(submit).toHaveBeenCalledWith('demo@example.com');
    expect(component.status()).toBe('success');
  });

  it('does not call the real service when the honeypot field is filled', async () => {
    const fixture = createInstance();
    const component = fixture.componentInstance;

    component.form.setValue({ email: 'bot@example.com', consent: true, company: 'I am a bot' });
    await component.onSubmit();

    expect(submit).not.toHaveBeenCalled();
    expect(component.status()).toBe('success');
  });

  it('ignores a second submit while one is already in flight', async () => {
    const fixture = createInstance();
    const component = fixture.componentInstance;
    component.form.setValue({ email: 'demo@example.com', consent: true, company: '' });

    const firstSubmit = component.onSubmit();
    const secondSubmit = component.onSubmit();
    await Promise.all([firstSubmit, secondSubmit]);

    expect(submit).toHaveBeenCalledTimes(1);
  });
});
