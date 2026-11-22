import { joinBasePath } from '@nocobase/app-server/support';
import { isDeepStrictEqual } from 'node:util';

import {
  DEFAULT_MAIL_CONFIG,
  mailSectionEnvironmentMappings,
  resolveMailAutomaticSyncIntervalFromMs,
  resolveMailOAuthCallbackUrl,
  type MailConfig,
} from './config.js';
import { type MailProviderAccountCount } from './contracts/persistence.js';
import {
  type MailProviderView,
  type MailSettingSource,
  type MailSettingsOverview,
  type MailSettingValue,
} from '../shared/mail.js';

export interface MailSettingsOverviewInput {
  readonly config: MailConfig;
  readonly providers: readonly MailProviderView[];
  readonly accountCounts: readonly MailProviderAccountCount[];
  /** The origin OAuth redirects use, as the authorization route resolves it. */
  readonly origin: string;
  readonly publicBasePath: string;
  readonly credentialVault: 'builtin' | 'application';
  /** The process environment, to tell a value set by an `MAIL_*` variable apart. */
  readonly env?: Readonly<Record<string, string | undefined>>;
  /**
   * The configuration's layers as the application merged them (`AppConfig.layers()`): what its code declares and what
   * its configuration files and environment supply. Absent when the configuration cannot tell them apart, and every
   * value not set by an environment variable is then reported with an unknown source.
   */
  readonly layers?: {
    readonly defaults: Readonly<Record<string, unknown>>;
    readonly overrides: Readonly<Record<string, unknown>>;
  };
}

const ATTENTION_STATUSES = new Set(['reauthorizationRequired', 'revoked']);

/**
 * The Mail settings overview, built field by field from the configuration and the account counts: nothing is spread
 * from the configuration or a Provider entry, so client secrets, passwords and the push webhook secret can never reach
 * the response, and no message, draft or submission table is read.
 */
export function buildMailSettingsOverview(
  input: MailSettingsOverviewInput,
): MailSettingsOverview {
  const { config, accountCounts } = input;
  const env = input.env ?? {};
  const overrides = mailSection(input.layers?.overrides);
  const declared = mailSection(input.layers?.defaults);
  // Decided by where the key is written, never by comparing values: `logRetentionDays: 90` in config.yml is configured
  // even though it equals the default.
  const source = (path: keyof MailConfig): MailSettingSource => {
    for (const [variable, mapping] of Object.entries(
      mailSectionEnvironmentMappings,
    ))
      if (mapping.path === path && env[variable]?.trim()) return 'environment';
    if (!input.layers) return 'unknown';
    if (overrides?.[path] !== undefined) return 'config';
    if (
      declared?.[path] !== undefined &&
      !isDeepStrictEqual(declared[path], DEFAULT_MAIL_CONFIG[path])
    )
      return 'code';
    return 'default';
  };
  const setting = <T>(
    path: keyof MailConfig,
    value: T,
  ): MailSettingValue<T> => ({ value, source: source(path) });

  const countsOf = (name: string, type: string) =>
    accountCounts.filter(
      (count) => count.providerName === name && count.providerType === type,
    );
  const totalOf = (status: string) =>
    accountCounts
      .filter((count) => count.status === status)
      .reduce((sum, count) => sum + count.count, 0);

  return {
    providers: input.providers.map((provider) => {
      const counts = countsOf(provider.name, provider.type);
      return {
        name: provider.name,
        type: provider.type,
        label: provider.label,
        ...(provider.connection ? { connection: provider.connection } : {}),
        capabilities: Object.fromEntries(
          Object.entries(provider.capabilities).filter(
            (entry): entry is [string, boolean] =>
              typeof entry[1] === 'boolean',
          ),
        ),
        source: provider.configured === false ? 'code' : 'config',
        accountCount: counts.reduce((sum, count) => sum + count.count, 0),
        attentionCount: counts
          .filter((count) => ATTENTION_STATUSES.has(count.status))
          .reduce((sum, count) => sum + count.count, 0),
      };
    }),
    accounts: {
      total: accountCounts.reduce((sum, count) => sum + count.count, 0),
      reauthorizationRequired:
        totalOf('reauthorizationRequired') + totalOf('revoked'),
      suspended: totalOf('suspended'),
      removing: totalOf('removing'),
    },
    runtime: {
      automaticSyncIntervalMinutes: setting(
        'automaticSyncIntervalMs',
        resolveMailAutomaticSyncIntervalFromMs(config.automaticSyncIntervalMs),
      ),
      syncBatchSize: setting('syncBatchSize', config.syncBatchSize),
      oauthCallbackUrl: setting(
        'oauthCallbackUrl',
        resolveMailOAuthCallbackUrl(
          config.oauthCallbackUrl,
          input.origin,
          input.publicBasePath,
        ),
      ),
      oauthReturnUrl: setting(
        'oauthReturnUrl',
        appUrl(
          config.oauthReturnUrl ?? DEFAULT_MAIL_CONFIG.oauthReturnUrl ?? '/',
          input.publicBasePath,
        ),
      ),
      pushWebhookUrl: setting(
        'pushWebhookUrl',
        config.pushWebhookUrl?.trim() || null,
      ),
      pushWebhookSecretConfigured: setting(
        'pushWebhookSecret',
        Boolean(config.pushWebhookSecret?.trim()),
      ),
      jobs: setting('jobs', config.jobs ?? null),
      logRetentionDays: setting('logRetentionDays', config.logRetentionDays),
      credentialVault: {
        value: input.credentialVault,
        source: input.credentialVault === 'application' ? 'code' : 'default',
      },
    },
  };
}

/** The `mail` section of one configuration layer, when it has one. */
function mailSection(
  layer: Readonly<Record<string, unknown>> | undefined,
): Readonly<Record<string, unknown>> | undefined {
  const section = layer?.mail;
  return typeof section === 'object' &&
    section !== null &&
    !Array.isArray(section)
    ? (section as Readonly<Record<string, unknown>>)
    : undefined;
}

/** An app-local path below the public base path; an absolute URL as it is. */
function appUrl(value: string, publicBasePath: string): string {
  const trimmed = value.trim() || '/';
  return /^[a-z][a-z\d+.-]*:/iu.test(trimmed)
    ? trimmed
    : joinBasePath(publicBasePath, trimmed);
}
