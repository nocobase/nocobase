import {
  defineHttpMiddleware,
  type AppHttpMiddleware,
} from '@nocobase/app-server/router';

import type { Context } from 'hono';

import { isDemoMode, type DemoModeContainer } from './is-demo-mode.js';
import { respondDemoReadOnly } from './read-only-response.js';

export interface DemoEffectsGuardAllowRule {
  readonly method: string;
  readonly path: string;
}

export interface DemoEffectsGuardOptions {
  /** Application-relative paths, including /api when applicable, without the deployment base path. */
  readonly paths: readonly string[];
  /** Explicit method/path exceptions. These still pass through authorization and the database write guard. */
  readonly allow?: readonly DemoEffectsGuardAllowRule[];
}

export interface DemoEffectsGuardApplication {
  readonly container: DemoModeContainer;
}

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Supports literal segments, :parameters, and a final /* matching the subtree including its root. */
function compilePath(path: string): RegExp {
  if (!path.startsWith('/') || /[?#]/u.test(path)) {
    throw new Error(`Invalid demo effects guard path: ${path}`);
  }
  const segments = path.slice(1).split('/');
  const source = segments
    .map((segment, index) => {
      if (segment === '*' && index === segments.length - 1) return '(?:/.*)?';
      if (/^:[A-Za-z_][A-Za-z0-9_]*$/u.test(segment)) return '/[^/]+';
      if (
        segment.includes('*') ||
        segment.includes(':') ||
        (!segment && path !== '/')
      ) {
        throw new Error(`Invalid demo effects guard path: ${path}`);
      }
      return `/${segment.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}`;
    })
    .join('');
  return new RegExp(`^${source}/?$`, 'u');
}

/** Refuses non-read requests before route handlers can perform external effects. Register after i18n. */
export function demoEffectsGuard(
  options: DemoEffectsGuardOptions,
): AppHttpMiddleware<DemoEffectsGuardApplication> {
  const paths = options.paths.map(compilePath);
  const allow = (options.allow ?? []).map((rule) => {
    if (!/^[A-Za-z]+$/u.test(rule.method)) {
      throw new Error(`Invalid demo effects guard method: ${rule.method}`);
    }
    return { method: rule.method.toUpperCase(), path: compilePath(rule.path) };
  });
  return defineHttpMiddleware({
    name: '@nocobase/app-plugin-demo-mode/effects-guard',
    register(router, app) {
      router.use('*', async (context: Context, next) => {
        const { method, path } = context.req;
        if (
          READ_METHODS.has(method) ||
          !paths.some((pattern) => pattern.test(path)) ||
          allow.some(
            (rule) => rule.method === method && rule.path.test(path),
          ) ||
          !isDemoMode(app.container)
        ) {
          await next();
          return;
        }
        respondDemoReadOnly(context);
      });
    },
  });
}
