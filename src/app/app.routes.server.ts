import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'aviso-de-privacidad', renderMode: RenderMode.Prerender },
  { path: 'terminos-de-uso', renderMode: RenderMode.Prerender },
  { path: 'seguridad', renderMode: RenderMode.Prerender },
  { path: '404', renderMode: RenderMode.Prerender },
  // Any path that doesn't match a known route (typo, deleted link) is rendered on demand rather
  // than prerendered, since there is no finite set of unknown URLs to generate at build time.
  { path: '**', renderMode: RenderMode.Server },
];
