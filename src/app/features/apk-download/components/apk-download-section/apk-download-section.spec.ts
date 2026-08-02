import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import { ToastService } from '../../../../core/services/toast.service';
import { UNAVAILABLE_APK_DOWNLOAD_INFO } from '../../models/apk-download-info.model';
import { ApkDownloadService } from '../../services/apk-download.service';
import { ApkDownloadSection } from './apk-download-section';

function setup(info: ReturnType<typeof signal>, copyHash = vi.fn().mockResolvedValue(true)) {
  const showToast = vi.fn();
  TestBed.configureTestingModule({
    imports: [ApkDownloadSection],
    providers: [
      { provide: ApkDownloadService, useValue: { info, copyHash } },
      { provide: ToastService, useValue: { show: showToast, toasts: signal([]) } },
    ],
  });
  const fixture = TestBed.createComponent(ApkDownloadSection);
  return { fixture, showToast, copyHash };
}

describe('ApkDownloadSection', () => {
  it('shows a disabled "not available" button when there is no APK configured', async () => {
    const { fixture } = setup(signal(UNAVAILABLE_APK_DOWNLOAD_INFO));
    await fixture.whenStable();

    const button = fixture.nativeElement.querySelector('button[disabled]');
    expect(button?.textContent).toContain('APK no disponible');
    expect(fixture.nativeElement.querySelector('a[href]')).toBeNull();
  });

  it('shows an enabled download link with correct attributes when configured', async () => {
    const { fixture } = setup(
      signal({
        available: true,
        downloadUrl: 'https://github.com/example/app.apk',
        version: '1.0.0',
        releaseDate: '',
        fileSize: '',
        sha256: '',
        hashAvailable: false,
      }),
    );
    await fixture.whenStable();

    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[href]');
    expect(link.getAttribute('href')).toBe('https://github.com/example/app.apk');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('calls the service to copy the hash and shows a toast', async () => {
    const { fixture, showToast, copyHash } = setup(
      signal({
        available: true,
        downloadUrl: 'https://github.com/example/app.apk',
        version: '1.0.0',
        releaseDate: '',
        fileSize: '',
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        hashAvailable: true,
      }),
    );
    await fixture.whenStable();

    const copyButton: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    copyButton.click();
    await fixture.whenStable();

    expect(copyHash).toHaveBeenCalled();
    expect(showToast).toHaveBeenCalled();
  });
});
