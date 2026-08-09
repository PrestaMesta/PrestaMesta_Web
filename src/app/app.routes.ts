import { Routes } from '@angular/router';
import { adminAuthGuard } from './features/admin/auth/guards/admin-auth.guard';
import { adminLoanAccessGuard } from './features/admin/auth/guards/admin-loan-access.guard';
import { adminMfaEnrollDeactivateGuard } from './features/admin/auth/guards/admin-mfa-enroll-deactivate.guard';
import { adminMfaStepGuard } from './features/admin/auth/guards/admin-mfa-flow.guard';
import { adminSuperadminGuard } from './features/admin/auth/guards/admin-superadmin.guard';

export const routes: Routes = [
  {
    path: '',
    title: 'PrestaMesta — Tus préstamos, más claros y cerca de ti',
    loadComponent: () =>
      import('./features/home/pages/home-page/home-page').then((m) => m.HomePage),
  },
  {
    path: 'aviso-de-privacidad',
    title: 'Aviso de privacidad — PrestaMesta',
    loadComponent: () =>
      import('./features/privacy/pages/privacy-page/privacy-page').then((m) => m.PrivacyPage),
  },
  {
    path: 'terminos-de-uso',
    title: 'Términos de uso — PrestaMesta',
    loadComponent: () =>
      import('./features/terms/pages/terms-page/terms-page').then((m) => m.TermsPage),
  },
  {
    path: 'seguridad',
    title: 'Seguridad — PrestaMesta',
    loadComponent: () =>
      import('./features/security-information/pages/security-information-page/security-information-page').then(
        (m) => m.SecurityInformationPage,
      ),
  },
  {
    path: '404',
    title: 'Página no encontrada — PrestaMesta',
    loadComponent: () =>
      import('./features/not-found/pages/not-found-page/not-found-page').then(
        (m) => m.NotFoundPage,
      ),
  },
  {
    path: 'admin/login',
    title: 'Iniciar sesión — Panel administrativo PrestaMesta',
    loadComponent: () =>
      import('./features/admin/auth/pages/admin-login-page/admin-login-page').then(
        (m) => m.AdminLoginPage,
      ),
  },
  {
    path: 'admin/mfa/enrolar',
    title: 'Verificación en dos pasos — Panel administrativo PrestaMesta',
    canActivate: [adminMfaStepGuard('MFA_ENROLLMENT_REQUIRED')],
    canDeactivate: [adminMfaEnrollDeactivateGuard],
    loadComponent: () =>
      import('./features/admin/auth/pages/admin-mfa-enroll-page/admin-mfa-enroll-page').then(
        (m) => m.AdminMfaEnrollPage,
      ),
  },
  {
    path: 'admin/mfa/verificar',
    title: 'Verificación en dos pasos — Panel administrativo PrestaMesta',
    canActivate: [adminMfaStepGuard('MFA_CHALLENGE_REQUIRED')],
    loadComponent: () =>
      import('./features/admin/auth/pages/admin-mfa-verify-page/admin-mfa-verify-page').then(
        (m) => m.AdminMfaVerifyPage,
      ),
  },
  {
    path: 'admin',
    canActivate: [adminAuthGuard],
    loadComponent: () =>
      import('./features/admin/layout/admin-shell/admin-shell').then((m) => m.AdminShell),
    children: [
      {
        path: '',
        pathMatch: 'full',
        title: 'Inicio — Panel administrativo PrestaMesta',
        loadComponent: () =>
          import('./features/admin/pages/admin-home-page/admin-home-page').then(
            (m) => m.AdminHomePage,
          ),
      },
      {
        path: 'creditos',
        title: 'Créditos — Panel administrativo PrestaMesta',
        loadComponent: () =>
          import('./features/admin/credits/pages/admin-credits-page/admin-credits-page').then(
            (m) => m.AdminCreditsPage,
          ),
      },
      {
        path: 'solicitudes',
        canActivate: [adminLoanAccessGuard],
        children: [
          {
            path: '',
            pathMatch: 'full',
            title: 'Solicitudes — Panel administrativo PrestaMesta',
            loadComponent: () =>
              import('./features/admin/loan-requests/pages/admin-requests-page/admin-requests-page').then(
                (m) => m.AdminRequestsPage,
              ),
          },
          {
            path: ':id',
            title: 'Detalle de solicitud — Panel administrativo PrestaMesta',
            loadComponent: () =>
              import('./features/admin/loan-requests/pages/admin-request-detail-page/admin-request-detail-page').then(
                (m) => m.AdminRequestDetailPage,
              ),
          },
        ],
      },
      {
        path: 'administradores',
        canActivate: [adminSuperadminGuard],
        title: 'Administradores — Panel administrativo PrestaMesta',
        loadComponent: () =>
          import('./features/admin/administrators/pages/admin-administrators-page/admin-administrators-page').then(
            (m) => m.AdminAdministratorsPage,
          ),
      },
    ],
  },
  {
    path: '**',
    title: 'Página no encontrada — PrestaMesta',
    loadComponent: () =>
      import('./features/not-found/pages/not-found-page/not-found-page').then(
        (m) => m.NotFoundPage,
      ),
  },
];
