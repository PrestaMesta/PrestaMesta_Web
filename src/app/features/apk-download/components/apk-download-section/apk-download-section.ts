import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../../../core/services/toast.service';
import { Icon } from '../../../../shared/components/icon/icon';
import { ApkDownloadService } from '../../services/apk-download.service';

@Component({
  selector: 'app-apk-download-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Icon],
  templateUrl: './apk-download-section.html',
})
export class ApkDownloadSection {
  private readonly apkDownload = inject(ApkDownloadService);
  private readonly toast = inject(ToastService);

  protected readonly info = this.apkDownload.info;

  async copyHash(): Promise<void> {
    const copied = await this.apkDownload.copyHash();
    this.toast.show(copied ? 'Hash copiado al portapapeles.' : 'No se pudo copiar el hash.');
  }
}
