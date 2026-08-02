import { Injectable, computed, inject, isDevMode } from '@angular/core';
import { AppConfigService } from '../../../core/config/app-config.service';
import { ApkDownloadInfo, UNAVAILABLE_APK_DOWNLOAD_INFO } from '../models/apk-download-info.model';
import { isValidSha256, normalizeSha256 } from '../validators/sha256.validator';
import { validateDownloadUrl } from '../validators/url.validator';

/** APK releases are only trusted from the configured site itself or from GitHub Releases. */
function buildAllowedHosts(siteUrl: string): readonly string[] {
  const hosts = ['github.com'];

  if (siteUrl) {
    try {
      hosts.push(new URL(siteUrl).hostname.toLowerCase());
    } catch {
      // Malformed siteUrl is surfaced elsewhere; it simply doesn't contribute an allowed host.
    }
  }

  return hosts;
}

/**
 * Derives a safe, display-ready `ApkDownloadInfo` from the public runtime configuration. A
 * download is only ever marked `available` once its URL has passed validation — an invalid or
 * tampered URL degrades to "not available" rather than being offered to the user.
 */
@Injectable({ providedIn: 'root' })
export class ApkDownloadService {
  private readonly appConfig = inject(AppConfigService);

  readonly info = computed<ApkDownloadInfo>(() => {
    const config = this.appConfig.config();

    const urlResult = validateDownloadUrl(config.apkDownloadUrl, {
      allowLocalhostHttp: isDevMode(),
      allowedHosts: buildAllowedHosts(config.siteUrl),
    });

    if (!urlResult.valid) {
      return UNAVAILABLE_APK_DOWNLOAD_INFO;
    }

    const hashAvailable = isValidSha256(config.apkSha256);

    return {
      available: true,
      downloadUrl: config.apkDownloadUrl,
      version: config.apkVersion,
      releaseDate: config.apkReleaseDate,
      fileSize: config.apkFileSize,
      sha256: hashAvailable ? normalizeSha256(config.apkSha256) : '',
      hashAvailable,
    };
  });

  async copyHash(): Promise<boolean> {
    const hash = this.info().sha256;
    if (!hash || typeof navigator === 'undefined' || !navigator.clipboard) {
      return false;
    }

    try {
      await navigator.clipboard.writeText(hash);
      return true;
    } catch {
      return false;
    }
  }
}
