import {
  createServiceToken,
  type ServiceResolver,
  type ServiceToken,
} from '@nocobase/service-provider';
import { useContext, type ReactNode } from 'react';

import { ClientApplicationContext } from './application-context.js';

/** What a toast reports. The application picks its icon and color, and may present each kind differently. */
export type ToastType = 'success' | 'info' | 'warning' | 'error' | 'loading';

/**
 * A button shown inside a toast. Clicking it runs `onClick` and leaves the toast open; call `close` with the toast's
 * id from `onClick` to dismiss it as well.
 */
export interface ToastAction {
  readonly label: ReactNode;
  readonly onClick: () => void;
}

/**
 * What a toast says. Where it appears, how it looks and how assistive technology announces it are decided by the
 * application's toaster, not by the code that shows it.
 */
export interface ToastOptions {
  /**
   * Identifies the toast. Showing a toast with the id of one still open replaces that toast's content and restarts
   * its timer instead of adding a second one; the replaced content's `onClose` does not run.
   */
  readonly id?: string;
  /** Omit it for a toast that reports nothing in particular. */
  readonly type?: ToastType;
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /**
   * Milliseconds until the toast closes by itself; `0` keeps it open until it is closed. Omit it for the
   * application's default. A `loading` toast never closes by itself.
   */
  readonly duration?: number;
  readonly action?: ToastAction;
  /** Runs when the toast starts closing: when it times out, when the user dismisses it, and when `close` is called. */
  readonly onClose?: () => void;
}

/**
 * Shows transient feedback, such as the result of an action. Plugins and application code reach it through
 * `useToaster()`, so none of them depends on how toasts are rendered; the application supplies the implementation
 * by registering it under `toasterToken`.
 */
export interface Toaster {
  /** Shows a toast and returns its id. */
  show(options: ToastOptions): string;
  /** Closes the toast with this id. An id that is not showing is ignored. */
  close(id: string): void;
}

/**
 * The application registers its toaster here, from a client ServiceProvider's `register()`. Nothing registers one by
 * default: rendering toasts belongs to the application's UI, which `@nocobase/app-client` does not choose.
 */
export const toasterToken: ServiceToken<Toaster> = createServiceToken<Toaster>(
  '@nocobase/app-client/toaster',
);

let unregisteredToastCount = 0;
let explainedUnregistered = false;

/**
 * Stands in when the application registered no toaster. A missing toaster should cost the user a message, never the
 * page that reports it, so nothing throws. Every toast it drops goes to the console instead — an error toast as an
 * error — and the first one says how to register a toaster.
 */
const unregisteredToaster: Toaster = Object.freeze({
  show(options: ToastOptions): string {
    const reason = explainedUnregistered
      ? 'Toast not shown: the application registers no toaster.'
      : "Toast not shown: the application registers no toaster. Register one under toasterToken from '@nocobase/app-client' in a client ServiceProvider's register().";
    explainedUnregistered = true;
    const report: unknown[] =
      options.description === undefined
        ? [reason, options.title]
        : [reason, options.title, options.description];
    if (options.type === 'error') console.error(...report);
    else console.warn(...report);
    unregisteredToastCount += 1;
    return options.id ?? `unregistered-toast-${unregisteredToastCount}`;
  },
  close(): void {},
});

/**
 * Returns the toaster registered in `services`, or the stand-in that shows nothing and logs each toast when none is.
 * For code outside React, such as a ServiceProvider; components call `useToaster()`.
 */
export function resolveToaster(services: ServiceResolver): Toaster {
  return services.has(toasterToken)
    ? services.resolve(toasterToken)
    : unregisteredToaster;
}

/**
 * Returns the application's toaster. The same instance is returned on every render, so it can be listed in hook
 * dependencies. Outside an application, or in one that registers no toaster, toasts are not shown: each goes to the
 * console instead, and nothing throws.
 */
export function useToaster(): Toaster {
  const app = useContext(ClientApplicationContext);
  return app ? resolveToaster(app.services) : unregisteredToaster;
}
