import { Injectable, signal } from '@angular/core';

export interface Toast {
  readonly id: number;
  readonly message: string;
}

const DEFAULT_DURATION_MS = 4000;

/** Minimal, dependency-free toast queue announced through an `aria-live` region. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsSignal = signal<readonly Toast[]>([]);
  private nextId = 0;

  readonly toasts = this.toastsSignal.asReadonly();

  show(message: string, durationMs = DEFAULT_DURATION_MS): void {
    const id = this.nextId++;
    this.toastsSignal.update((toasts) => [...toasts, { id, message }]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  dismiss(id: number): void {
    this.toastsSignal.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }
}
