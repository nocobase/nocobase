import { createContext, useContext, type Context } from 'react';

export interface RouteOverlayContextValue {
  /** Runs `beforeClose`, then navigates to the parent route unless it declined. Concurrent calls share one request. */
  readonly close: () => Promise<void>;
  /** True while a close request for the current location is pending. */
  readonly isClosing: boolean;
}

/** Internal context shared by both route overlay components. */
export const RouteOverlayContext: Context<RouteOverlayContextValue | null> =
  createContext<RouteOverlayContextValue | null>(null);

/**
 * Closes the enclosing `RouteDialog` or `RouteDrawer`. Call it from a component rendered inside the overlay — its
 * body or its footer — never from the page that returns the overlay, which sits outside the provider.
 */
export function useRouteOverlay(): RouteOverlayContextValue {
  const value = useContext(RouteOverlayContext);
  if (!value) {
    throw new Error(
      'useRouteOverlay must be used inside RouteDialog or RouteDrawer',
    );
  }
  return value;
}
