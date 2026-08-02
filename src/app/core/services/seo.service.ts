import { DOCUMENT } from '@angular/common';
import { Meta, Title } from '@angular/platform-browser';
import { Injectable, inject } from '@angular/core';
import { AppConfigService } from '../config/app-config.service';

export interface SeoMetadata {
  /** Short, human-written page description used for `description`, Open Graph and Twitter Card. */
  readonly description: string;
  /** Route path (e.g. `/seguridad`) used to build the canonical URL when a site URL is configured. */
  readonly path: string;
}

/**
 * Thin wrapper around Angular's own `Title`/`Meta` services. Each routed page calls
 * `updateMetadata()` once so its title/description/social tags stay accurate — the canonical URL
 * and `og:url` are only emitted when `siteUrl` is configured, since without it there is no public
 * URL to point to.
 */
@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly appConfig = inject(AppConfigService);
  private readonly document = inject(DOCUMENT);

  updateMetadata(metadata: SeoMetadata): void {
    const pageTitle = this.title.getTitle();

    this.meta.updateTag({ name: 'description', content: metadata.description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: metadata.description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ name: 'twitter:card', content: 'summary' });
    this.meta.updateTag({ name: 'twitter:title', content: pageTitle });
    this.meta.updateTag({ name: 'twitter:description', content: metadata.description });

    const siteUrl = this.appConfig.config().siteUrl;
    if (!siteUrl) {
      return;
    }

    const canonicalUrl = `${siteUrl.replace(/\/$/, '')}${metadata.path}`;
    this.meta.updateTag({ property: 'og:url', content: canonicalUrl });
    this.setCanonicalLink(canonicalUrl);
  }

  private setCanonicalLink(url: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');

    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }

    link.setAttribute('href', url);
  }
}
