import { createContext } from "react";

export type RouteSurfaceCloseOptions = {
  skipBeforeClose?: boolean;
};

export type RouteSurfaceClose = (
  options?: RouteSurfaceCloseOptions
) => Promise<boolean>;

export const RouteSurfaceContext = createContext<RouteSurfaceClose | null>(null);

export const RouteOverlayDepthContext = createContext(0);
