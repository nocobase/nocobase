import type { ReactElement } from 'react';

import { RouteOverlay, type RouteOverlayProps } from './route-overlay.js';

export type RouteDrawerProps = RouteOverlayProps;

/** A child route presented as a modal panel docked to the right edge of the viewport. */
export function RouteDrawer(props: RouteDrawerProps): ReactElement {
  return <RouteOverlay {...props} drawer />;
}
