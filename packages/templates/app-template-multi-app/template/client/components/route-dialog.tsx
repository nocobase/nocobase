import type { ReactElement } from 'react';

import { RouteOverlay, type RouteOverlayProps } from './route-overlay.js';

export type RouteDialogProps = RouteOverlayProps;

/** A child route presented as a centered modal dialog. */
export function RouteDialog(props: RouteDialogProps): ReactElement {
  return <RouteOverlay {...props} />;
}
