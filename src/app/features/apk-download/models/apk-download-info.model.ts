export interface ApkDownloadInfo {
  /** `true` only when the configured URL passed validation and can be offered for download. */
  readonly available: boolean;
  readonly downloadUrl: string;
  readonly version: string;
  readonly releaseDate: string;
  readonly fileSize: string;
  readonly sha256: string;
  /** `true` when `sha256` is a well-formed digest, regardless of `available`. */
  readonly hashAvailable: boolean;
}

export const UNAVAILABLE_APK_DOWNLOAD_INFO: ApkDownloadInfo = {
  available: false,
  downloadUrl: '',
  version: '',
  releaseDate: '',
  fileSize: '',
  sha256: '',
  hashAvailable: false,
};
