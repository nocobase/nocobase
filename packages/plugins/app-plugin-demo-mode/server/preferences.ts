import { AsyncLocalStorage } from 'node:async_hooks';

import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import {
  UserPreferenceError,
  userPreferencesServiceToken,
} from '@nocobase/app-plugin-users/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { apiDocsToken } from '@nocobase/app-server/router';
import { createAppCookieScope } from '@nocobase/app-server/support';
import type { Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';

import { describeDemoPreferences } from './preferences-document.js';

const keys = ['locale', 'theme.mode', 'theme.preset'] as const;
type PreferenceKey = (typeof keys)[number];
const valueSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9._-]+$/u);
const prefix = '/api/users/me/preferences';

interface VisitorPreferences {
  readonly context: Context;
  readonly values: Record<PreferenceKey, string>;
  readonly changes: Map<PreferenceKey, string | null>;
}

function isPreferenceKey(key: string): key is PreferenceKey {
  return (keys as readonly string[]).includes(key);
}

function parseValue(value: unknown): string {
  const parsed = valueSchema.safeParse(value);
  if (!parsed.success)
    throw new UserPreferenceError(
      'INVALID_PREFERENCE_VALUE',
      'A demo presentation preference must be a non-empty identifier of at most 100 characters.',
    );
  return parsed.data;
}

/**
 * Keep Users' routes, auth, validation and the application's HTTP pipeline. Only preference service calls for the
 * authenticated owner inside this API use visitor cookies. Calls from jobs, seeds and other endpoints keep account
 * storage. Adapt the existing instance because the container does not support replacing a registered service.
 */
export function registerDemoPreferences(
  app: AppPluginApplication,
): (() => void) | undefined {
  const { container } = app;
  if (
    !container.has(authenticationToken) ||
    !container.has(userPreferencesServiceToken)
  )
    return;
  const preferences = container.resolve(userPreferencesServiceToken);
  /* eslint-disable @typescript-eslint/unbound-method -- Retain method identities for cleanup; calls below preserve the receiver with .call(). */
  const original = {
    list: preferences.list,
    get: preferences.get,
    set: preferences.set,
    setMany: preferences.setMany,
    remove: preferences.remove,
  };
  /* eslint-enable @typescript-eslint/unbound-method */
  const requests = new AsyncLocalStorage<VisitorPreferences>();
  const visitor = (userId: string): VisitorPreferences | undefined => {
    const state = requests.getStore();
    const auth = state?.context.get('auth') as
      { user: { id: string } } | undefined;
    return auth?.user.id === userId ? state : undefined;
  };
  const defaults: Record<PreferenceKey, string> = {
    locale: app.config.get<string>('i18n.defaultLocale') ?? 'en-US',
    'theme.mode':
      app.config.get<string>('client.app.defaultColorScheme') ?? 'system',
    'theme.preset':
      app.config.get<string>('client.app.defaultTheme') ?? 'compact',
  };
  const scope = createAppCookieScope(app.publicBasePath);
  const cookieName = (key: PreferenceKey): string =>
    `nocobase_demo_${scope}_${key.replaceAll('.', '_')}`;
  const secure =
    app.config.get<string>('app.publicOrigin')?.startsWith('https://') ?? false;
  const cookieOptions = {
    path: app.publicBasePath || '/',
    httpOnly: true,
    secure,
    sameSite: secure ? ('None' as const) : ('Lax' as const),
    partitioned: secure,
  };
  const change = (
    state: VisitorPreferences,
    key: PreferenceKey,
    value: string | null,
  ): void => {
    state.values[key] = value ?? defaults[key];
    state.changes.set(key, value);
  };
  const adapted: typeof original = {
    async list(userId) {
      const account = await original.list.call(preferences, userId);
      const state = visitor(userId);
      return state ? { ...account, ...state.values } : account;
    },
    async get(userId, key) {
      const state = visitor(userId);
      return state && isPreferenceKey(key)
        ? state.values[key]
        : original.get.call(preferences, userId, key);
    },
    async set(userId, key, value) {
      const state = visitor(userId);
      if (!state || !isPreferenceKey(key))
        return original.set.call(preferences, userId, key, value);
      change(state, key, parseValue(value));
    },
    async setMany(userId, values) {
      const state = visitor(userId);
      if (!state) return original.setMany.call(preferences, userId, values);
      const isolated: [PreferenceKey, string][] = [];
      const ordinary = Object.fromEntries(
        Object.entries(values).filter(([key]) => !isPreferenceKey(key)),
      );
      for (const [key, value] of Object.entries(values)) {
        if (isPreferenceKey(key)) isolated.push([key, parseValue(value)]);
      }
      // Validate and persist the ordinary part first. A refused batch must not change the visitor's cookies.
      if (Object.keys(ordinary).length)
        await original.setMany.call(preferences, userId, ordinary);
      for (const [key, value] of isolated) change(state, key, value);
    },
    async remove(userId, key) {
      const state = visitor(userId);
      if (!state || !isPreferenceKey(key))
        return original.remove.call(preferences, userId, key);
      change(state, key, null);
    },
  };
  Object.assign(preferences, adapted);
  app.router.use(`${prefix}/*`, async (context: Context, next) => {
    context.header('Cache-Control', 'private, no-store');
    const values = { ...defaults };
    for (const key of keys) {
      const parsed = valueSchema.safeParse(getCookie(context, cookieName(key)));
      if (parsed.success) values[key] = parsed.data;
    }
    const state: VisitorPreferences = {
      context,
      values,
      changes: new Map(),
    };
    await requests.run(state, next);
    // Do not issue cookies when the route's subsequent read fails or the global request deadline expires.
    if (context.res.status >= 400 || context.error) return;
    for (const [key, value] of state.changes) {
      if (value === null) deleteCookie(context, cookieName(key), cookieOptions);
      else setCookie(context, cookieName(key), value, cookieOptions);
    }
  });
  const releaseDocument = container.has(apiDocsToken)
    ? container
        .resolve(apiDocsToken)
        .addTransform(describeDemoPreferences(keys, valueSchema))
    : undefined;
  return () => {
    releaseDocument?.();
    for (const key of Object.keys(adapted) as (keyof typeof adapted)[]) {
      if (preferences[key] === adapted[key])
        Object.assign(preferences, { [key]: original[key] });
    }
    requests.disable();
  };
}
