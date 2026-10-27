import { authenticationToken } from '@nocobase/app-plugin-authentication/server';
import {
  UserPreferenceError,
  userPreferencesServiceToken,
} from '@nocobase/app-plugin-users/server';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import {
  ApiError,
  apiErrorHandler,
  apiValidator,
  installApiLimits,
  requestIdMiddleware,
  type ApiConfig,
} from '@nocobase/app-server/router';
import { Hono, type Context } from 'hono';
import { deleteCookie, getCookie, setCookie } from 'hono/cookie';
import { z } from 'zod';

const keys = ['locale', 'theme.mode', 'theme.preset'] as const;
type PreferenceKey = (typeof keys)[number];
const valueSchema = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9._-]+$/u);
const inputSchema = z.strictObject({ value: valueSchema });
const batchSchema = z.record(z.string(), z.unknown());
const prefix = '/api/users/me/preferences';

function isPreferenceKey(key: string): key is PreferenceKey {
  return (keys as readonly string[]).includes(key);
}

/**
 * Adapt the existing Users API only in demos. Its account storage must never receive these visitor choices, even
 * when userPreferences is writable. Register before contributed routes so plugin ordering cannot change isolation.
 * Cookies contain only validated presentation values, carry no authority, and expire with the browser session.
 * Separate cookies prevent concurrent locale/theme writes from overwriting one another.
 */
export function registerDemoPreferences(app: AppPluginApplication): void {
  const { container } = app;
  if (
    !container.has(authenticationToken) ||
    !container.has(userPreferencesServiceToken)
  )
    return;
  const auth = container.resolve(authenticationToken);
  const preferences = container.resolve(userPreferencesServiceToken);
  const secure =
    app.config.get<string>('app.publicOrigin')?.startsWith('https://') ?? false;
  const defaults: Record<PreferenceKey, string> = {
    locale: app.config.get<string>('i18n.defaultLocale') ?? 'en-US',
    'theme.mode':
      app.config.get<string>('client.app.defaultColorScheme') ?? 'system',
    'theme.preset':
      app.config.get<string>('client.app.defaultTheme') ?? 'compact',
  };
  const cookieName = (key: PreferenceKey): string =>
    `nocobase_demo_${key.replaceAll('.', '_')}`;
  const read = (context: Context): Record<PreferenceKey, string> =>
    Object.fromEntries(
      keys.map((key) => {
        const parsed = valueSchema.safeParse(
          getCookie(context, cookieName(key)),
        );
        return [key, parsed.success ? parsed.data : defaults[key]];
      }),
    ) as Record<PreferenceKey, string>;
  const cookieOptions = {
    path: app.publicBasePath || '/',
    httpOnly: true,
    secure,
    sameSite: secure ? ('None' as const) : ('Lax' as const),
    partitioned: secure,
  };
  const write = (context: Context, key: PreferenceKey, value: string): void => {
    setCookie(context, cookieName(key), value, cookieOptions);
  };

  const router = new Hono<{ Variables: { auth: { user: { id: string } } } }>({
    strict: false,
  });
  router.onError((error, context) =>
    apiErrorHandler(
      error instanceof UserPreferenceError
        ? new ApiError({
            status: 'INVALID_ARGUMENT',
            reason: error.code,
            domain: 'users',
            message: error.message,
          })
        : error,
      context,
    ),
  );
  // This adapter precedes the application's API router, so retain its limits and request IDs as well as Users auth.
  const limited = new Hono();
  limited.onError(apiErrorHandler);
  limited.use('*', requestIdMiddleware());
  installApiLimits(limited, app.config.get<ApiConfig>('api'));
  router.use('*', async (context, next) => {
    context.header('Cache-Control', 'private, no-store');
    await next();
  });
  router.use('*', auth.required());
  const list = async (
    context: Context,
    userId: string,
  ): Promise<Record<string, unknown>> => ({
    ...(await preferences.list(userId)),
    ...read(context),
  });
  router.get(prefix, async (context) =>
    context.json({ data: await list(context, context.get('auth').user.id) }),
  );
  router.patch(prefix, apiValidator('json', batchSchema), async (context) => {
    const input = context.req.valid('json');
    const isolated: Partial<Record<PreferenceKey, string>> = {};
    const ordinary = Object.fromEntries(
      Object.entries(input).filter(([key]) => !isPreferenceKey(key)),
    );
    for (const [key, value] of Object.entries(input)) {
      if (isPreferenceKey(key)) {
        const result = valueSchema.safeParse(value);
        if (!result.success)
          throw new ApiError({
            status: 'INVALID_ARGUMENT',
            reason: 'INVALID_PREFERENCE_VALUE',
            domain: 'users',
            message:
              'A demo presentation preference must be a non-empty identifier of at most 100 characters.',
          });
        isolated[key] = result.data;
      }
    }
    // Validate and persist the ordinary part before issuing any cookies: a rejected batch changes neither part.
    if (Object.keys(ordinary).length)
      await preferences.setMany(context.get('auth').user.id, ordinary);
    const data = {
      ...(await list(context, context.get('auth').user.id)),
      ...isolated,
    };
    for (const key of keys)
      if (isolated[key] !== undefined) write(context, key, isolated[key]);
    return context.json({ data });
  });
  router.put(
    `${prefix}/:key`,
    apiValidator('json', inputSchema),
    async (context) => {
      const key = context.req.param('key');
      if (!isPreferenceKey(key))
        throw new Error('Unexpected demo preference key.');
      const { value } = context.req.valid('json');
      write(context, key, value);
      return context.json({ data: { value } });
    },
  );
  router.delete(`${prefix}/:key`, async (context) => {
    const key = context.req.param('key');
    if (!isPreferenceKey(key))
      throw new Error('Unexpected demo preference key.');
    deleteCookie(context, cookieName(key), cookieOptions);
    return context.body(null, 204);
  });

  limited.route('/', router);

  // Unknown methods/keys must still reach the original API, including its validation and 404 handling.
  app.router.use(`${prefix}/*`, async (context, next) => {
    const path = context.req.path;
    const method = context.req.method;
    const collection = path === prefix || path === `${prefix}/`;
    let key: string;
    try {
      key = decodeURIComponent(path.slice(prefix.length + 1));
    } catch {
      return next();
    }
    if (
      !(collection && (method === 'GET' || method === 'PATCH')) &&
      !(isPreferenceKey(key) && (method === 'PUT' || method === 'DELETE'))
    )
      return next();
    return limited.fetch(context.req.raw, context.env);
  });
}
