/**
 * Only ever follows a `returnUrl` back into `/admin/**` — never an attacker-supplied external
 * redirect, even though today it can only come from our own guards — and never back into
 * `/admin/login` or an `/admin/mfa/**` page itself, either of which would bounce a freshly
 * authenticated admin into a redirect loop instead of the dashboard.
 */
export function resolveSafeAdminReturnUrl(returnUrl: string | null): string {
  const isSafe =
    !!returnUrl &&
    returnUrl.startsWith('/admin') &&
    !returnUrl.startsWith('/admin/login') &&
    !returnUrl.startsWith('/admin/mfa');

  return isSafe ? (returnUrl as string) : '/admin';
}
