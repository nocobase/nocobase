import { ConcurrentConfigurationError } from '@nocobase/concurrency';
import type { ConfigValidationContext } from '@nocobase/app-server/config';
import type {
  AppConcurrencyConfig,
  ResolvedConcurrencyConfig,
} from '../shared/types.js';

const COMMON_FIELDS = new Set(['adapter', 'namespace', 'ttl', 'connection']);
const NAME = /^[A-Za-z][A-Za-z0-9_-]*$/u;
export const BUILTIN_MEMORY_KEY: string = 'built-in-memory';
export interface ConcurrencySnapshot {
  readonly defaultKey: string;
  readonly entries: ReadonlyMap<string, ResolvedConcurrencyConfig>;
}
function fail(path: string, message: string): never {
  throw new ConcurrentConfigurationError(`${path}: ${message}`);
}
function object(value: unknown, path: string): Record<string, unknown> {
  if (
    value === null ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null)
  )
    fail(path, 'Expected a plain object.');
  return value as Record<string, unknown>;
}
function positive(value: unknown, path: string): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 2147483647
  )
    fail(path, 'Expected an integer between 1 and 2147483647.');
  return value;
}
function nonempty(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.length === 0)
    fail(path, 'Expected a non-empty string.');
  return value;
}
/** Copies only JSON-shaped configuration and freezes every nested value. */
function frozenCopy(
  value: unknown,
  path: string,
  parents: Set<object> = new Set(),
): unknown {
  if (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'boolean' ||
    (typeof value === 'number' && Number.isFinite(value))
  )
    return value;
  if (typeof value !== 'object' || parents.has(value))
    fail(path, 'Expected an acyclic configuration value.');
  parents.add(value);
  try {
    if (Array.isArray(value))
      return Object.freeze(
        value.map((item: unknown) => frozenCopy(item, path, parents)),
      );
    const source = object(value, path);
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(source))
      Object.defineProperty(result, key, {
        value: frozenCopy(item, path, parents),
        enumerable: true,
      });
    return Object.freeze(result);
  } finally {
    parents.delete(value);
  }
}
function resolveEntry(
  key: string,
  value: unknown,
  appName: string,
): ResolvedConcurrencyConfig {
  const entry = object(value, key);
  for (const field of Reflect.ownKeys(entry)) {
    if (typeof field !== 'string' || !COMMON_FIELDS.has(field))
      fail(key, 'Unknown configuration field.');
  }
  const adapter = nonempty(entry.adapter, `${key}.adapter`);
  if (adapter === 'mutex' && Object.hasOwn(entry, 'connection'))
    fail(`${key}.connection`, 'Mutex does not accept a connection.');
  const resolved = {
    key,
    adapter,
    namespace: nonempty(
      entry.namespace === undefined ? appName : entry.namespace,
      `${key}.namespace`,
    ),
    ...(entry.ttl === undefined
      ? {}
      : { ttl: positive(entry.ttl, `${key}.ttl`) }),
    ...(Object.hasOwn(entry, 'connection')
      ? {
          connection: frozenCopy(
            object(entry.connection, `${key}.connection`),
            `${key}.connection`,
          ),
        }
      : {}),
  };
  // Unknown adapters may remain unused; registered implementations validate their own connection contract at boot.
  return Object.freeze(resolved) as ResolvedConcurrencyConfig;
}
export function resolveConcurrencyConfig(
  value: unknown,
  appName: string,
): ConcurrencySnapshot {
  nonempty(appName, 'appName');
  const section = value === undefined ? {} : object(value, 'concurrency');
  const entries = new Map<string, ResolvedConcurrencyConfig>();
  for (const key of Reflect.ownKeys(section)) {
    if (key === 'default') continue;
    if (typeof key !== 'string' || !NAME.test(key))
      fail('concurrency', 'Invalid configuration name.');
    entries.set(key, resolveEntry(key, section[key], appName));
  }
  let defaultKey: string;
  if (section.default === undefined) {
    // This key is not inserted into the user namespace: a declared same-named entry cannot replace it.
    defaultKey = '';
    entries.set(
      defaultKey,
      resolveEntry(BUILTIN_MEMORY_KEY, { adapter: 'mutex' }, appName),
    );
  } else {
    defaultKey = nonempty(section.default, 'default');
    if (defaultKey === 'default' || !entries.has(defaultKey))
      fail('default', 'Must name an existing configuration.');
  }
  return { defaultKey, entries };
}
export function validateConcurrencyConfig(
  value: AppConcurrencyConfig,
  context: ConfigValidationContext,
): void {
  try {
    resolveConcurrencyConfig(value, 'application');
  } catch (error) {
    if (!(error instanceof ConcurrentConfigurationError)) throw error;
    const separator = error.message.indexOf(': ');
    context.error(
      error.message.slice(0, separator),
      error.message.slice(separator + 2),
    );
  }
}
