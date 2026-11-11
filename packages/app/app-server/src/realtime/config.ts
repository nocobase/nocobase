import type { RealtimeServiceOptions } from '@nocobase/realtime/server';
import {
  defineAppConfig,
  type AppConfigFactory,
} from '../config/define-app-config.js';
import {
  createRealtimeBrokerRegistry,
  type RealtimeBrokerRegistry,
} from './broker-registry.js';

export interface AppRealtimeBrokerConfig {
  readonly [key: string]: unknown;
  readonly adapter: string;
}

export interface AppRealtimeConfig {
  readonly [key: string]: unknown;
  readonly broker?: AppRealtimeBrokerConfig;
  readonly namespace?: string;
  readonly authorizationTimeoutMs?: number;
  readonly sessionCheckIntervalMs?: number;
  readonly limits?: {
    readonly maxConcurrentAuthorizations?: number;
    readonly maxPendingAuthorizations?: number;
    readonly maxRecentEventIds?: number;
    readonly maxConnections?: number;
    readonly maxMessageBytes?: number;
    readonly maxSubscriptionsPerConnection?: number;
    readonly maxBufferedBytesPerConnection?: number;
    readonly maxPendingMessagesPerConnection?: number;
  };
}

/** No adapter default: an explicitly supplied broker must select its adapter. */
export function defineRealtimeConfig(
  defaults: AppRealtimeConfig = {},
): AppConfigFactory<AppRealtimeConfig> {
  return defineAppConfig({
    defaults,
    validate(value, context) {
      for (const issue of configurationIssues(value))
        context.error(issue.path, issue.message);
    },
  });
}

/** Extension-specific values are validated only by the selected factory. */
export function realtimeServiceOptions(
  config: AppRealtimeConfig = {},
  appName: string = 'default',
  registry: RealtimeBrokerRegistry = createRealtimeBrokerRegistry(),
  logger?: RealtimeServiceOptions['logger'],
): RealtimeServiceOptions {
  const issues = configurationIssues(config);
  if (issues.length)
    throw new TypeError(
      issues
        .map(
          ({ path, message }) =>
            `${path ? `realtime.${path}` : 'realtime'} ${message}`,
        )
        .join(' '),
    );
  const namespace = config.namespace ?? appName;
  if (typeof namespace !== 'string' || !namespace.trim())
    throw new TypeError('Realtime namespace must be a non-empty string.');
  const adapter =
    config.broker === undefined ? 'inMemory' : config.broker.adapter;
  return {
    ...config.limits,
    broker: registry.create(adapter, { namespace, config, logger }),
    namespace,
    authorizationTimeoutMs: config.authorizationTimeoutMs,
    sessionCheckIntervalMs: config.sessionCheckIntervalMs,
  };
}

function configurationIssues(
  value: unknown,
): { path: string; message: string }[] {
  if (!isRecord(value)) return [{ path: '', message: 'must be an object.' }];
  const issues: { path: string; message: string }[] = [];
  for (const [path, destination] of [
    ['adapter', 'Move it to realtime.broker.adapter.'],
    ['redis', 'Move its options to realtime.broker.'],
  ]) {
    if (Object.hasOwn(value, path))
      issues.push({
        path,
        message: `uses the old configuration format. ${destination}`,
      });
  }
  if (Object.hasOwn(value, 'broker')) {
    if (!isRecord(value.broker))
      issues.push({ path: 'broker', message: 'must be an object.' });
    else {
      if (
        typeof value.broker.adapter !== 'string' ||
        !value.broker.adapter.trim()
      )
        issues.push({
          path: 'broker.adapter',
          message: 'must be a non-empty string.',
        });
      if (Object.hasOwn(value.broker, 'namespace'))
        issues.push({
          path: 'broker.namespace',
          message: 'is not supported. Use realtime.namespace.',
        });
    }
  }
  if (value.limits !== undefined && !isRecord(value.limits))
    issues.push({ path: 'limits', message: 'must be an object.' });
  return issues;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
