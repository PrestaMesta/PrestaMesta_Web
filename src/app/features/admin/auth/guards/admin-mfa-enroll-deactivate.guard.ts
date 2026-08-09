import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { AdminMfaEnrollPage } from '../pages/admin-mfa-enroll-page/admin-mfa-enroll-page';

const LEAVE_WARNING =
  'Tus códigos de recuperación no se han guardado. Si sales ahora, no volverán a mostrarse y ' +
  'tendrás que iniciar sesión de nuevo. ¿Deseas salir de todas formas?';

/**
 * Blocks leaving `/admin/mfa/enrolar` — via Router navigation, a clicked link, or the browser
 * back/forward buttons (Angular's Router intercepts these too) — while recovery codes are still
 * pending acknowledgement. Complements `AdminMfaEnrollPage.warnBeforeUnload`, which only covers a
 * hard reload/tab close; this guard is what covers in-app navigation. SSR-safe: this route is
 * never deactivated during SSR (there is no live Router navigation happening server-side), but the
 * `isPlatformBrowser` check keeps `window.confirm` from ever being called outside a real browser.
 */
export const adminMfaEnrollDeactivateGuard: CanDeactivateFn<AdminMfaEnrollPage> = (component) => {
  if (component.recoveryCodes() === null) {
    return true;
  }

  if (!isPlatformBrowser(inject(PLATFORM_ID))) {
    return true;
  }

  const confirmedLeave = window.confirm(LEAVE_WARNING);
  if (confirmedLeave) {
    component.abandonEnrollment();
  }
  return confirmedLeave;
};
