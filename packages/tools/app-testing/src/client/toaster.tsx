import type { Toaster, ToastOptions, ToastType } from '@nocobase/app-client';
import {
  useSyncExternalStore,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from 'react';

/** A toast as a test sees it: what a page reported, without the application's markup. */
export interface TestToast {
  readonly id: string;
  readonly type?: ToastType;
  readonly title: ReactNode;
  readonly description?: ReactNode;
}

/** How long a toast stays when the page gives no duration, as the Base UI toaster the templates use. */
const DEFAULT_DURATION = 5000;

interface OpenToast extends TestToast {
  readonly options: ToastOptions;
  readonly timer?: ReturnType<typeof setTimeout>;
}

/**
 * Stands in for the application's toaster. Each toast is kept until it closes — after its duration, when a page closes
 * it, or when the application shuts down — so a test can read what a page reported, and `TestToasts` renders the open
 * ones as plain text.
 */
export class TestToaster implements Toaster {
  private toasts: readonly OpenToast[] = [];
  private readonly listeners = new Set<() => void>();
  private count = 0;

  public show(options: ToastOptions): string {
    this.count += 1;
    const id = options.id ?? `test-toast-${this.count}`;
    const replaced = this.toasts.find((toast) => toast.id === id);
    if (replaced?.timer !== undefined) clearTimeout(replaced.timer);
    const duration = options.duration ?? DEFAULT_DURATION;
    const timer =
      options.type === 'loading' || duration === 0
        ? undefined
        : setTimeout(() => this.close(id), duration);
    const toast: OpenToast = {
      id,
      ...(options.type === undefined ? {} : { type: options.type }),
      title: options.title,
      ...(options.description === undefined
        ? {}
        : { description: options.description }),
      options,
      ...(timer === undefined ? {} : { timer }),
    };
    this.toasts = replaced
      ? this.toasts.map((current) => (current.id === id ? toast : current))
      : [...this.toasts, toast];
    this.emit();
    return id;
  }

  public close(id: string): void {
    const toast = this.toasts.find((current) => current.id === id);
    if (!toast) return;
    if (toast.timer !== undefined) clearTimeout(toast.timer);
    this.toasts = this.toasts.filter((current) => current.id !== id);
    this.emit();
    toast.options.onClose?.();
  }

  /** The toasts open now, oldest first, without the options and timer behind each. */
  public list(): readonly TestToast[] {
    return this.toasts.map(({ id, type, title, description }): TestToast => ({
      id,
      type,
      title,
      description,
    }));
  }

  /** Clears every timer, without running `onClose`: the application is going away, not closing its toasts. */
  public dispose(): void {
    for (const toast of this.toasts) {
      if (toast.timer !== undefined) clearTimeout(toast.timer);
    }
    this.toasts = [];
    this.emit();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return (): void => {
      this.listeners.delete(listener);
    };
  }

  public snapshot(): readonly OpenToast[] {
    return this.toasts;
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

/** Renders the page, then the toasts open in `toaster`, each as its title, description and action. */
export function TestToasts({
  toaster,
  children,
}: PropsWithChildren<{ readonly toaster: TestToaster }>): ReactElement {
  const toasts = useSyncExternalStore(
    (listener) => toaster.subscribe(listener),
    () => toaster.snapshot(),
  );
  return (
    <>
      {children}
      {toasts.map((toast): ReactElement => (
        <div key={toast.id} data-toast-type={toast.type}>
          <div>{toast.title}</div>
          {toast.description === undefined ? null : (
            <div>{toast.description}</div>
          )}
          {toast.options.action ? (
            <button type='button' onClick={toast.options.action.onClick}>
              {toast.options.action.label}
            </button>
          ) : null}
        </div>
      ))}
    </>
  );
}
