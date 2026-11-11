import {
  RouteOverlayContext,
  type RouteOverlayContextValue,
} from '@nocobase/app-client/route-containers';
import { useContext } from 'react';

// The context lives in `@nocobase/app-client` so every copy of the route overlay components, including a plugin's,
// shares it: a footer button inside a panel the application opened reaches that panel's close request.
export { RouteOverlayContext, type RouteOverlayContextValue };

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
