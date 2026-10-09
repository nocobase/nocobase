import {
  defineAppConfig,
  envInteger,
  envString,
  type AppConfigFactory,
  type EnvironmentMapping,
} from '@nocobase/app-server/config';
import { joinBasePath, normalizeBasePath } from '@nocobase/app-server/support';

export interface MailProviderConfigEntry {
  readonly type: string;
  readonly enabled?: boolean;
  readonly [key: string]: unknown;
  readonly quota?: {
    readonly projectId?: string;
    readonly unitsPerUserPerMinute?: number;
    readonly unitsPerProjectPerMinute?: number;
  };
}

export const DEFAULT_MAIL_SYNC_BATCH_SIZE = 100;
export const MAX_MAIL_SYNC_BATCH_SIZE = 200;
export const DEFAULT_GMAIL_QUOTA_UNITS_PER_USER_PER_MINUTE = 6_000;
export const DEFAULT_GMAIL_QUOTA_UNITS_PER_PROJECT_PER_MINUTE = 1_200_000;
export const DEFAULT_MAIL_OAUTH_CALLBACK_PATH = '/mail/oauth/callback';
export const DEFAULT_MAIL_OAUTH_RETURN_PATH = '/dev/mail/accounts';
export const DEFAULT_MAIL_AUTOMATIC_SYNC_INTERVAL_MS = 300_000;
export const DEFAULT_MAIL_AUTOMATIC_SYNC_INTERVAL_MINUTES = 5;
export const MIN_MAIL_AUTOMATIC_SYNC_INTERVAL_MINUTES = 1;

const MAIL_CALLBACK_URL_BASE = 'https://mail-callback.invalid';
const MAIL_LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', 'localhost']);

export interface MailConfig {
  readonly oauthCallbackUrl?: string;
  readonly oauthReturnUrl?: string;
  readonly automaticSyncIntervalMs: number;
  readonly syncBatchSize: number;
  readonly pushWebhookUrl?: string;
  readonly pushWebhookSecret?: string;
  /**
   * The `jobs` configuration synchronization and scheduled send tasks run on. Omitted, they follow `jobs.default`, like
   * every other consumer of the jobs service.
   */
  readonly jobs?: string;
  readonly providers: Readonly<Record<string, MailProviderConfigEntry>>;
}

export const DEFAULT_MAIL_CONFIG: MailConfig = Object.freeze({
  oauthCallbackUrl: DEFAULT_MAIL_OAUTH_CALLBACK_PATH,
  oauthReturnUrl: DEFAULT_MAIL_OAUTH_RETURN_PATH,
  automaticSyncIntervalMs: DEFAULT_MAIL_AUTOMATIC_SYNC_INTERVAL_MS,
  syncBatchSize: DEFAULT_MAIL_SYNC_BATCH_SIZE,
  providers: {},
});

/** Environment mappings for applications to merge into their environment provider. */
export const mailEnvironmentMappings: Readonly<
  Record<string, EnvironmentMapping>
> = {
  MAIL_OAUTH_CALLBACK_URL: envString('mail.oauthCallbackUrl'),
  MAIL_OAUTH_RETURN_URL: envString('mail.oauthReturnUrl'),
  MAIL_AUTOMATIC_SYNC_INTERVAL_MS: envInteger('mail.automaticSyncIntervalMs'),
  MAIL_SYNC_BATCH_SIZE: envInteger('mail.syncBatchSize'),
  MAIL_PUSH_WEBHOOK_URL: envString('mail.pushWebhookUrl'),
  MAIL_PUSH_WEBHOOK_SECRET: envString('mail.pushWebhookSecret'),
  MAIL_JOBS: envString('mail.jobs'),
};

/** Application-owned default configuration factory for the Mail module. */
export const mailConfig: AppConfigFactory<MailConfig> = defineAppConfig({
  defaults: DEFAULT_MAIL_CONFIG,
});

/**
 * Resolves the Mail namespace at the plugin boundary.
 *
 * An application may register Mail before adding an application config factory.
 * In that case Mail remains usable with no configured providers and its built-in
 * defaults. Once the namespace exists, malformed values are rejected with a
 * path-specific error instead of becoming an unrelated startup exception.
 */
export function resolveMailConfig(value: unknown): MailConfig {
  if (value === undefined) return DEFAULT_MAIL_CONFIG;
  if (!isRecord(value)) {
    throw new TypeError('Mail configuration at "mail" must be an object.');
  }

  const configuredProviders = value.providers;
  if (configuredProviders !== undefined && !isRecord(configuredProviders)) {
    throw new TypeError(
      'Mail configuration at "mail.providers" must be an object.',
    );
  }
  const providers = configuredProviders ?? DEFAULT_MAIL_CONFIG.providers;
  for (const [name, provider] of Object.entries(providers)) {
    if (!isRecord(provider) || typeof provider.type !== 'string') {
      throw new TypeError(
        `Mail provider configuration at "mail.providers.${name}" must include a string "type".`,
      );
    }
    if (
      provider.enabled !== undefined &&
      typeof provider.enabled !== 'boolean'
    ) {
      throw new TypeError(
        `Mail provider configuration at "mail.providers.${name}.enabled" must be a boolean.`,
      );
    }
    if (provider.quota !== undefined) {
      if (provider.type !== 'gmail' || !isRecord(provider.quota)) {
        throw new TypeError(
          `Mail configuration at "mail.providers.${name}.quota" is only valid for Gmail and must be an object.`,
        );
      }
      if (
        provider.quota.projectId !== undefined &&
        (typeof provider.quota.projectId !== 'string' ||
          provider.quota.projectId.trim().length === 0)
      ) {
        throw new TypeError(
          `Mail configuration at "mail.providers.${name}.quota.projectId" must be a non-empty Google Cloud project ID.`,
        );
      }
      for (const key of [
        'unitsPerUserPerMinute',
        'unitsPerProjectPerMinute',
      ] as const) {
        const quota = provider.quota[key];
        if (
          quota !== undefined &&
          (typeof quota !== 'number' ||
            !Number.isSafeInteger(quota) ||
            quota <= 0)
        ) {
          throw new TypeError(
            `Mail configuration at "mail.providers.${name}.quota.${key}" must be a positive safe integer.`,
          );
        }
      }
    }
  }

  const configuredOAuthCallbackUrl = value.oauthCallbackUrl;
  if (
    configuredOAuthCallbackUrl !== undefined &&
    typeof configuredOAuthCallbackUrl !== 'string'
  ) {
    throw new TypeError(
      'Mail configuration at "mail.oauthCallbackUrl" must be a string.',
    );
  }
  const oauthCallbackUrl =
    configuredOAuthCallbackUrl ?? DEFAULT_MAIL_CONFIG.oauthCallbackUrl;

  const configuredOAuthReturnUrl = value.oauthReturnUrl;
  if (
    configuredOAuthReturnUrl !== undefined &&
    typeof configuredOAuthReturnUrl !== 'string'
  ) {
    throw new TypeError(
      'Mail configuration at "mail.oauthReturnUrl" must be a string.',
    );
  }
  const oauthReturnUrl =
    configuredOAuthReturnUrl ?? DEFAULT_MAIL_CONFIG.oauthReturnUrl;

  const pushWebhookUrl = value.pushWebhookUrl;
  if (pushWebhookUrl !== undefined && typeof pushWebhookUrl !== 'string') {
    throw new TypeError(
      'Mail configuration at "mail.pushWebhookUrl" must be a string.',
    );
  }

  const pushWebhookSecret = value.pushWebhookSecret;
  if (
    pushWebhookSecret !== undefined &&
    typeof pushWebhookSecret !== 'string'
  ) {
    throw new TypeError(
      'Mail configuration at "mail.pushWebhookSecret" must be a string.',
    );
  }

  const jobs = value.jobs;
  if (jobs !== undefined && (typeof jobs !== 'string' || jobs.length === 0)) {
    throw new TypeError(
      'Mail configuration at "mail.jobs" must be a non-empty string.',
    );
  }

  const configuredAutomaticSyncIntervalMs = value.automaticSyncIntervalMs;
  if (
    configuredAutomaticSyncIntervalMs !== undefined &&
    typeof configuredAutomaticSyncIntervalMs !== 'number'
  ) {
    throw new TypeError(
      'Mail configuration at "mail.automaticSyncIntervalMs" must be a number.',
    );
  }
  const automaticSyncIntervalMs =
    configuredAutomaticSyncIntervalMs ??
    DEFAULT_MAIL_CONFIG.automaticSyncIntervalMs;
  resolveMailAutomaticSyncIntervalFromMs(automaticSyncIntervalMs);

  const configuredSyncBatchSize = value.syncBatchSize;
  if (
    configuredSyncBatchSize !== undefined &&
    typeof configuredSyncBatchSize !== 'number'
  ) {
    throw new TypeError(
      'Mail configuration at "mail.syncBatchSize" must be a number.',
    );
  }
  const syncBatchSize =
    configuredSyncBatchSize ?? DEFAULT_MAIL_CONFIG.syncBatchSize;
  resolveMailSyncBatchSize(syncBatchSize);

  return {
    oauthCallbackUrl,
    oauthReturnUrl,
    automaticSyncIntervalMs,
    syncBatchSize,
    ...(pushWebhookUrl === undefined ? {} : { pushWebhookUrl }),
    ...(pushWebhookSecret === undefined ? {} : { pushWebhookSecret }),
    ...(jobs === undefined ? {} : { jobs }),
    providers: providers as MailConfig['providers'],
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function resolveMailOAuthOrigin(
  configuredOrigin: string | undefined,
  requestOrigin: string,
): string {
  const configured = configuredOrigin?.trim();
  if (!configured) return requestOrigin;

  try {
    const configuredUrl = new URL(configured);
    const requestUrl = new URL(requestOrigin);
    if (
      configuredUrl.protocol === requestUrl.protocol &&
      configuredUrl.port === requestUrl.port &&
      isMailLoopbackHost(configuredUrl.hostname) &&
      isMailLoopbackHost(requestUrl.hostname)
    ) {
      return requestUrl.origin;
    }
  } catch {
    // Keep the configured origin. Its validation belongs to the app config.
  }

  return configured;
}

export function resolveMailOAuthCallbackUrl(
  configuredUrl: string | undefined,
  origin: string,
  publicBasePath: string,
): string {
  const value = configuredUrl?.trim() || DEFAULT_MAIL_OAUTH_CALLBACK_PATH;
  const absolute = parseAbsoluteMailUrl(value);
  if (absolute) {
    resolveMailOAuthCallbackPath(value, publicBasePath);
    return absolute.toString();
  }

  const relative = parseRelativeMailUrl(value);
  const resolved = new URL(
    joinBasePath(publicBasePath, relative.pathname),
    origin,
  );
  resolved.search = relative.search;
  return resolved.toString();
}

export function resolveMailOAuthCallbackPath(
  configuredUrl: string | undefined,
  publicBasePath: string,
): string {
  const value = configuredUrl?.trim() || DEFAULT_MAIL_OAUTH_CALLBACK_PATH;
  const absolute = parseAbsoluteMailUrl(value);
  if (!absolute) {
    return normalizeBasePath(parseRelativeMailUrl(value).pathname) || '/';
  }

  const pathname = normalizeBasePath(absolute.pathname) || '/';
  const basePath = normalizeBasePath(publicBasePath);
  if (
    basePath &&
    pathname !== basePath &&
    !pathname.startsWith(`${basePath}/`)
  ) {
    throw new TypeError(
      `Mail OAuth callback URL must include application public base path "${basePath}".`,
    );
  }
  return (
    normalizeBasePath(basePath ? pathname.slice(basePath.length) : pathname) ||
    '/'
  );
}

export function resolveMailOAuthReturnUrl(
  configuredUrl: string | undefined,
  origin: string,
  publicBasePath: string,
  result: 'success' | 'failure',
): string {
  const value = configuredUrl?.trim() || DEFAULT_MAIL_OAUTH_RETURN_PATH;
  const absolute = parseAbsoluteMailUrl(value, 'Mail OAuth return URL');
  const relative = absolute
    ? undefined
    : parseRelativeMailUrl(value, 'Mail OAuth return URL');
  const resolved =
    absolute ??
    new URL(joinBasePath(publicBasePath, relative!.pathname), origin);
  if (relative) resolved.search = relative.search;
  resolved.searchParams.set('mailAuthorization', result);
  return absolute
    ? resolved.toString()
    : `${resolved.pathname}${resolved.search}`;
}

function parseAbsoluteMailUrl(
  value: string,
  label = 'Mail OAuth callback URL',
): URL | undefined {
  if (!/^[a-z][a-z\d+.-]*:/iu.test(value)) return undefined;
  const url = new URL(value);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new TypeError(`${label} must use the http or https protocol.`);
  }
  assertNoMailUrlFragment(url, label);
  return url;
}

function parseRelativeMailUrl(
  value: string,
  label = 'Mail OAuth callback URL',
): URL {
  const url = new URL(value, MAIL_CALLBACK_URL_BASE);
  if (url.origin !== MAIL_CALLBACK_URL_BASE) {
    throw new TypeError(
      `${label} must be an app-local path or an absolute http(s) URL.`,
    );
  }
  assertNoMailUrlFragment(url, label);
  return url;
}

function assertNoMailUrlFragment(url: URL, label: string): void {
  if (url.hash) {
    throw new TypeError(`${label} must not contain a URL fragment.`);
  }
}

function isMailLoopbackHost(hostname: string): boolean {
  return MAIL_LOOPBACK_HOSTS.has(
    hostname.replace(/^\[|\]$/g, '').toLowerCase(),
  );
}

export function resolveMailSyncBatchSize(value?: number): number {
  const resolved = value ?? DEFAULT_MAIL_SYNC_BATCH_SIZE;
  if (
    !Number.isSafeInteger(resolved) ||
    resolved < 1 ||
    resolved > MAX_MAIL_SYNC_BATCH_SIZE
  ) {
    throw new TypeError(
      `Mail syncBatchSize must be an integer from 1 through ${MAX_MAIL_SYNC_BATCH_SIZE}.`,
    );
  }
  return resolved;
}

export function resolveMailAutomaticSyncIntervalMinutes(
  value?: number,
): number {
  const resolved = value ?? DEFAULT_MAIL_AUTOMATIC_SYNC_INTERVAL_MINUTES;
  if (
    !Number.isSafeInteger(resolved) ||
    resolved < MIN_MAIL_AUTOMATIC_SYNC_INTERVAL_MINUTES
  ) {
    throw new TypeError(
      `Mail automatic sync interval must be a safe integer of at least ${MIN_MAIL_AUTOMATIC_SYNC_INTERVAL_MINUTES} minute.`,
    );
  }
  return resolved;
}

export function resolveMailAutomaticSyncIntervalFromMs(value?: number): number {
  const resolved = value ?? DEFAULT_MAIL_AUTOMATIC_SYNC_INTERVAL_MS;
  if (!Number.isSafeInteger(resolved) || resolved < 60_000) {
    throw new TypeError(
      'Mail automaticSyncIntervalMs must be a safe integer of at least 60000 milliseconds.',
    );
  }
  return resolveMailAutomaticSyncIntervalMinutes(Math.ceil(resolved / 60_000));
}
