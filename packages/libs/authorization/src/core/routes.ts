import type { AuthorizationContext } from './authorization.js';

export interface AuthorizationRouteRequest {
  request: Request;
  /** The request path relative to where the application mounted the dispatcher. */
  path: string;
  authorization: AuthorizationContext;
}

export type AuthorizationRouteHandler = (
  input: AuthorizationRouteRequest,
) => Promise<Response>;

/** One handler registered with `AuthorizationRouteRegistry.add`, under its normalized path. */
export interface AuthorizationRouteEntry {
  readonly path: string;
  readonly handler: AuthorizationRouteHandler;
}

/**
 * The HTTP surface the installed plugins contribute. A plugin registers its
 * own routes during setup, so an application mounts one dispatcher instead of
 * naming each plugin, and a plugin it did not install has no route at all.
 */
export class AuthorizationRouteRegistry {
  private readonly handlers = new Map<string, AuthorizationRouteHandler>();

  add(path: string, handler: AuthorizationRouteHandler): void {
    const normalized = normalizePath(path);
    if (this.handlers.has(normalized)) {
      throw new Error(`Authorization route already registered: ${normalized}`);
    }
    this.handlers.set(normalized, handler);
  }

  list(): readonly string[] {
    return [...this.handlers.keys()].sort();
  }

  /** Every registration with its handler, sorted by path like `list()`, for tooling such as an API document. */
  entries(): readonly AuthorizationRouteEntry[] {
    return [...this.handlers]
      .map(([path, handler]) => ({ path, handler }))
      .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  }

  /** The matching handler's response, or `undefined` when no plugin claims the path. */
  handle(input: AuthorizationRouteRequest): Promise<Response> | undefined {
    for (const [route, handler] of this.handlers) {
      if (input.path === route || input.path.startsWith(`${route}/`)) {
        return handler(input);
      }
    }
    return undefined;
  }
}

function normalizePath(path: string): string {
  return `/${path}`.replace(/\/+/g, '/').replace(/\/$/, '');
}
