import { type ReactNode } from "react";

import { RouteSurfaceContext } from "./route-surface-context";
import {
  type RouteSurfaceBeforeClose,
  useRouteSurfaceState,
} from "./use-route-surface-state";

export function RoutePage({
  children,
  closeTo,
  beforeClose,
}: {
  children: ReactNode;
  closeTo: string;
  beforeClose?: RouteSurfaceBeforeClose;
}) {
  const { close } = useRouteSurfaceState({
    closeTo,
    beforeClose,
    animated: false,
  });

  return (
    <RouteSurfaceContext.Provider value={close}>
      {children}
    </RouteSurfaceContext.Provider>
  );
}
