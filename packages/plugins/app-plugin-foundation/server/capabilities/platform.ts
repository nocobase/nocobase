import { cachingToken } from '@nocobase/app-server/caching';
import { i18nToken } from '@nocobase/app-server/i18n';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import { queueServiceToken } from '@nocobase/app-server/queue';
import { secretsServiceToken } from '@nocobase/app-server/secrets';
import type { ServiceToken } from '@nocobase/service-provider';

import type { FoundationPart } from '../../shared/foundation.js';
import {
  fact,
  metric,
  NO_DATABASE,
  type CapabilityCollector,
} from './types.js';

export const integrations: CapabilityCollector = {
  key: 'integrations',
  packages: ['@nocobase/app-plugin-api-keys'],
  async collect({ probe }) {
    if (!probe) return NO_DATABASE;
    if (!probe.has('apikey'))
      return { status: 'unused', reason: 'notRegistered' };
    const [enabled, used] = await Promise.all([
      probe.count('apikey', { enabled: true }),
      // A key someone has called the API with; holding one proves nothing about an integration.
      probe.count('apikey', (filter) =>
        filter.and([
          filter.boolean('enabled').isTrue(),
          filter.date('lastRequest').notEmpty(),
        ]),
      ),
    ]);
    const active = (used ?? 0) > 0;
    return {
      status: active ? 'active' : 'unused',
      ...(active
        ? {}
        : { reason: (enabled ?? 0) > 0 ? 'noUsedApiKey' : 'noApiKey' }),
      facts: active ? [fact('usedApiKeys', { count: used ?? 0 })] : [],
      metrics: [metric('usedApiKeys', used), metric('apiKeys', enabled)],
    };
  },
};

/**
 * What the server can tell about the interface: whether the NocoBase client serves it and which languages the
 * application offers. The page adds the pages and menu entries it registers, which only the browser knows.
 */
export const userInterface: CapabilityCollector = {
  key: 'interface',
  packages: [
    '@nocobase/app-client',
    '@nocobase/i18n',
    '@nocobase/app-plugin-i18n',
  ],
  collect({ container, hasClient }) {
    if (!hasClient)
      return Promise.resolve({ status: 'unused', reason: 'noClient' });
    const locales = container.has(i18nToken)
      ? container.resolve(i18nToken).getLocales()
      : undefined;
    return Promise.resolve({
      status: 'active',
      facts:
        locales === undefined
          ? []
          : [fact('locales', { count: locales.length, names: [...locales] })],
      metrics: locales === undefined ? [] : [metric('locales', locales.length)],
    });
  },
};

export const audit: CapabilityCollector = {
  key: 'audit',
  packages: [],
  collect() {
    // No supported audit collector exists yet. Other providers may supply audit capabilities; do not claim their
    // absence or use lifecycle history as a substitute for an operation audit.
    return Promise.resolve({ status: 'unused', reason: 'noRecognizedAudit' });
  },
};

/** The migration history the database layer keeps (`DEFAULT_MIGRATION_TABLE` in `@nocobase/db`). */
const MIGRATIONS_TABLE = '__nocobase_migrations';
const SEEDS_TABLE = '__nocobase_seeds';

const INFRASTRUCTURE: readonly {
  readonly key: string;
  readonly token: ServiceToken<unknown>;
}[] = [
  { key: 'jobs', token: jobExecutorServiceToken },
  { key: 'queue', token: queueServiceToken },
  { key: 'secrets', token: secretsServiceToken },
  { key: 'caching', token: cachingToken },
];

export const operations: CapabilityCollector = {
  key: 'operations',
  packages: [
    '@nocobase/app-server',
    '@nocobase/app-cli',
    '@nocobase/jobs',
    '@nocobase/queue',
    '@nocobase/caching',
    '@nocobase/secrets',
  ],
  async collect({ probe, container, applicationName }) {
    const parts: FoundationPart[] = INFRASTRUCTURE.map(({ key, token }) =>
      container.has(token)
        ? { key, status: 'active' }
        : { key, status: 'unused', reason: 'notConfigured' },
    );
    if (!probe) return { ...NO_DATABASE, parts };
    const [migrations, ownMigrations, seeds, latest] = await Promise.all([
      probe.internalCount(MIGRATIONS_TABLE),
      applicationName === undefined
        ? Promise.resolve(null)
        : probe.internalCount(MIGRATIONS_TABLE, {
            column: 'package_name',
            value: applicationName,
          }),
      probe.internalCount(SEEDS_TABLE),
      probe.internalMax(MIGRATIONS_TABLE, 'executed_at'),
    ]);
    const latestAt = toIsoTime(latest);
    return {
      status: 'active',
      facts: [
        ...(migrations === null
          ? []
          : [
              fact('migrations', {
                count: migrations,
                own: ownMigrations ?? 0,
              }),
            ]),
        ...(latestAt === undefined
          ? []
          : [fact('latestMigration', { at: latestAt })]),
      ],
      metrics: [
        metric('migrations', migrations),
        metric('applicationMigrations', ownMigrations),
        metric('seeds', seeds),
      ],
      parts: [{ key: 'migrations', status: 'active' }, ...parts],
    };
  },
};

/** The history stores times as epoch milliseconds or as a date string, depending on the dialect. */
function toIsoTime(value: unknown): string | undefined {
  const time =
    value instanceof Date
      ? value.getTime()
      : typeof value === 'number'
        ? value
        : typeof value === 'string'
          ? /^\d+$/.test(value)
            ? Number(value)
            : Date.parse(value)
          : Number.NaN;
  return Number.isFinite(time) ? new Date(time).toISOString() : undefined;
}
