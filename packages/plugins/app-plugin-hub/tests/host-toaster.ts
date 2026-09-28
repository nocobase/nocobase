import type { Toaster } from '@nocobase/app-client';
import { createContext, useContext, type Context } from 'react';

/** Provided by `ToastHost` in `tests/toast-host.tsx`. */
export const HostToasterContext: Context<Toaster | undefined> = createContext<
  Toaster | undefined
>(undefined);

/**
 * What a test hands Hub pages as `useToaster()`, in its `@nocobase/app-client` mock: the toaster of the `ToastHost`
 * the page renders in, so each rendered tree reports to its own host as each application does.
 */
export function useHostToaster(): Toaster {
  const toaster = useContext(HostToasterContext);
  if (!toaster) {
    throw new Error(
      'Render Hub pages with render() from tests/render.ts, which provides the toaster.',
    );
  }
  return toaster;
}
