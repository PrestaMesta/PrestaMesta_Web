import { Meta, Title } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppConfigService } from '../config/app-config.service';
import { DEFAULT_APP_CONFIG } from '../config/app-config.model';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let title: Title;
  let meta: Meta;

  function setup(siteUrl: string) {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AppConfigService,
          useValue: { config: signal({ ...DEFAULT_APP_CONFIG, siteUrl }) },
        },
      ],
    });
    service = TestBed.inject(SeoService);
    title = TestBed.inject(Title);
    meta = TestBed.inject(Meta);
    title.setTitle('Página de prueba — PrestaMesta');
  }

  beforeEach(() => setup(''));

  it('sets the description and social meta tags from the page title', () => {
    service.updateMetadata({ description: 'Descripción de prueba.', path: '/prueba' });

    expect(meta.getTag('name="description"')?.content).toBe('Descripción de prueba.');
    expect(meta.getTag('property="og:title"')?.content).toBe('Página de prueba — PrestaMesta');
    expect(meta.getTag('property="og:description"')?.content).toBe('Descripción de prueba.');
    expect(meta.getTag('name="twitter:title"')?.content).toBe('Página de prueba — PrestaMesta');
  });

  it('does not set a canonical link when no siteUrl is configured', () => {
    service.updateMetadata({ description: 'Sin sitio configurado.', path: '/prueba' });
    expect(document.head.querySelector('link[rel="canonical"]')).toBeNull();
  });

  it('sets a canonical link and og:url when siteUrl is configured', () => {
    setup('https://prestamesta.example.com/');
    service.updateMetadata({ description: 'Con sitio configurado.', path: '/prueba' });

    const canonical = document.head.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBe('https://prestamesta.example.com/prueba');
    expect(meta.getTag('property="og:url"')?.content).toBe(
      'https://prestamesta.example.com/prueba',
    );
  });
});
