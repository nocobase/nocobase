import { createContext, type Context, type ReactNode } from 'react';
import type { To } from 'react-router';

/**
 * The contexts that tie a route's container to the page rendered in it. They live here rather than in the copied
 * container components so every copy — an application's, a Registry install's or a plugin's — reads the same ones:
 * a plugin page's own `RouteDialog` then configures the panel the application opened, and its footer's
 * `useRouteOverlay()` reaches that panel's close request.
 */

export interface RouteOverlayContextValue {
  /** Runs `beforeClose`, then navigates to the parent route unless it declined. Concurrent calls share one request. */
  readonly close: () => Promise<void>;
  /** True while a close request for the current location is pending. */
  readonly isClosing: boolean;
}

/** Provided by every route dialog or drawer panel; `useRouteOverlay()` reads it. */
export const RouteOverlayContext: Context<RouteOverlayContextValue | null> =
  createContext<RouteOverlayContextValue | null>(null);

/** What a hosted page's `RouteDialog` or `RouteDrawer` hands to the panel the application opened for its route. */
export interface RouteOverlayHostConfig {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  readonly footer?: ReactNode;
  readonly closeTo?: To;
  readonly beforeClose?: () => boolean | Promise<boolean>;
  readonly className?: string;
}

export interface RouteOverlayHostValue {
  readonly configure: (config: RouteOverlayHostConfig) => void;
}

/**
 * Set for the page module rendered in a panel the application opened for a route declaring a `dialog` or `drawer`
 * presentation, and cleared again inside that page's own overlay, so only that overlay configures the panel.
 */
export const RouteOverlayHostContext: Context<RouteOverlayHostValue | null> =
  createContext<RouteOverlayHostValue | null>(null);

/** What a hosted page's `RouteChildPage` hands to the layer the application opened for its route. */
export interface RouteChildPageHostConfig {
  /** Classes the page's `RouteChildPage` would have put on its own layer. */
  readonly className?: string;
}

export interface RouteChildPageHostValue {
  readonly configure: (config: RouteChildPageHostConfig) => void;
}

/**
 * Set for the page module rendered in a layer the application opened for a route declaring a `child-page`
 * presentation, and cleared again inside that page's own `RouteChildPage`.
 */
export const RouteChildPageHostContext: Context<RouteChildPageHostValue | null> =
  createContext<RouteChildPageHostValue | null>(null);
