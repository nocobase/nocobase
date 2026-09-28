import { Toast } from '@base-ui/react/toast';
import type { Toaster } from '@nocobase/app-client';
import {
  useMemo,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from 'react';

import { HostToasterContext } from './host-toaster.js';

/**
 * Stands in for the application's toaster. Toasts render as plain text, so a test sees what a page reported rather
 * than toast markup, while Base UI keeps the timing: a toast still closes after its duration.
 */
export function ToastHost({ children }: PropsWithChildren): ReactElement {
  return (
    <Toast.Provider>
      <HostToaster>{children}</HostToaster>
      <ToastList />
    </Toast.Provider>
  );
}

/**
 * Adds to the provider's own store. A toast manager only reaches the provider once the provider has subscribed, in an
 * effect that runs after those of the page mounted with it, so a page reporting as it mounts would be missed.
 */
function HostToaster({ children }: PropsWithChildren): ReactElement {
  const { add, close } = Toast.useToastManager();
  const toaster = useMemo(
    (): Toaster => ({
      show: (options) =>
        add({
          id: options.id,
          type: options.type,
          title: options.title,
          description: options.description,
          timeout: options.duration,
          onClose: options.onClose,
        }),
      close: (id) => close(id),
    }),
    [add, close],
  );
  return (
    <HostToasterContext.Provider value={toaster}>
      {children}
    </HostToasterContext.Provider>
  );
}

function ToastList(): ReactNode {
  const { toasts } = Toast.useToastManager();
  return toasts
    .filter((toast) => toast.transitionStatus !== 'ending')
    .map((toast) => (
      <div key={toast.id} data-toast-type={toast.type}>
        <div>{toast.title}</div>
        {toast.description ? <div>{toast.description}</div> : null}
      </div>
    ));
}
