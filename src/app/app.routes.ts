import { Routes } from '@angular/router';

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
    path: '**',
    title: 'Página no encontrada — PrestaMesta',
    loadComponent: () =>
      import('./features/not-found/pages/not-found-page/not-found-page').then(
        (m) => m.NotFoundPage,
      ),
  },
];
