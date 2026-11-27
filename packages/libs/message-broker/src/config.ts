import type { SubscriptionBinding } from './runtime.js';
import type {
  MessageBrokerBackendEntry,
  MessageBrokerConfig,
} from './types.js';

export type BindingKind = 'publisher' | 'subscription';

const ROOT_FIELDS: ReadonlySet<string> = new Set(['default', 'backends']);
const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]*$/;

export const DEFAULT_MAX_ATTEMPTS = 3;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Throws unless `name` is a usable logical or backend name. */
export function assertName(
  label: string,
  name: unknown,
): asserts name is string {
  if (typeof name !== 'string' || !NAME_PATTERN.test(name)) {
    throw new TypeError(
      `${label} must start with a letter or digit and contain only letters, digits, ".", "_", ":" and "-".`,
    );
  }
}

function positiveInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) {
    throw new TypeError(`${label} must be a positive integer.`);
  }
  return value;
}

function nonNegativeInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    throw new TypeError(`${label} must be a non-negative integer.`);
  }
  return value;
}

function bindingSection(
  entry: Record<string, unknown>,
  field: 'publishers' | 'subscriptions',
  label: string,
): Record<string, Record<string, unknown>> {
  const section = entry[field];
  if (section === undefined) return {};
  if (!isRecord(section)) {
    throw new TypeError(`${label}.${field} must be an object.`);
  }
  for (const [name, binding] of Object.entries(section)) {
    assertName(`${label}.${field} key "${name}"`, name);
    if (!isRecord(binding)) {
      throw new TypeError(`${label}.${field}.${name} must be an object.`);
    }
  }
  return section as Record<string, Record<string, unknown>>;
}

/** Resolves the common options of a subscription binding; throws on an invalid one. */
export function resolveSubscriptionBinding(
  name: string,
  options: Readonly<Record<string, unknown>>,
  label: string,
  defaultMaxAttempts: number = DEFAULT_MAX_ATTEMPTS,
): SubscriptionBinding {
  const at = `${label}.subscriptions.${name}`;
  if (options.ordered !== undefined && typeof options.ordered !== 'boolean') {
    throw new TypeError(`${at}.ordered must be a boolean.`);
  }
  return {
    name,
    options,
    maxAttempts: positiveInteger(
      options.maxAttempts === undefined
        ? defaultMaxAttempts
        : options.maxAttempts,
      `${at}.maxAttempts`,
    ),
    retryDelay:
      options.retryDelay === undefined
        ? 0
        : nonNegativeInteger(options.retryDelay, `${at}.retryDelay`),
    concurrency:
      options.concurrency === undefined
        ? 1
        : positiveInteger(options.concurrency, `${at}.concurrency`),
    ordered: options.ordered === true,
  };
}

/**
 * Pure validation of the section: its shape, the common binding options, that `default` names a backend and that no
 * logical name is declared by two backends. Adapter options are left to each implementation.
 */
export function validateMessageBrokerConfig(
  config: MessageBrokerConfig | undefined,
): void {
  if (config === undefined) return;
  if (!isRecord(config)) {
    throw new TypeError('messageBroker must be an object.');
  }
  for (const field of Object.keys(config)) {
    if (!ROOT_FIELDS.has(field)) {
      throw new TypeError(
        `messageBroker accepts only "default" and "backends"; move "${field}" into a backend under messageBroker.backends.`,
      );
    }
  }
  const backends = config.backends ?? {};
  if (!isRecord(backends)) {
    throw new TypeError('messageBroker.backends must be an object.');
  }
  if (config.default !== undefined) {
    if (typeof config.default !== 'string') {
      throw new TypeError('messageBroker.default must name a backend.');
    }
    if (!Object.hasOwn(backends, config.default)) {
      throw new Error(
        `messageBroker.default names "${config.default}", which is not in messageBroker.backends.`,
      );
    }
  }
  const owners: Record<BindingKind, Map<string, string>> = {
    publisher: new Map(),
    subscription: new Map(),
  };
  for (const [backend, entry] of Object.entries(backends)) {
    const label = `messageBroker.backends.${backend}`;
    assertName(`Backend name "${backend}"`, backend);
    if (!isRecord(entry)) {
      throw new TypeError(`${label} must be an object.`);
    }
    if (typeof entry.adapter !== 'string' || entry.adapter === '') {
      throw new TypeError(`${label} needs an adapter name.`);
    }
    const publishers = bindingSection(entry, 'publishers', label);
    const subscriptions = bindingSection(entry, 'subscriptions', label);
    for (const [name, options] of Object.entries(subscriptions)) {
      resolveSubscriptionBinding(name, options, label);
    }
    for (const [kind, names] of [
      ['publisher', Object.keys(publishers)],
      ['subscription', Object.keys(subscriptions)],
    ] as const) {
      for (const name of names) {
        const owner = owners[kind].get(name);
        if (owner !== undefined) {
          throw new Error(
            `The ${kind} "${name}" is declared by both backend "${owner}" and backend "${backend}"; declare it in one.`,
          );
        }
        owners[kind].set(name, backend);
      }
    }
  }
}

/** The backend a logical name is declared in, or `undefined`. */
export function declaringBackend(
  config: MessageBrokerConfig | undefined,
  kind: BindingKind,
  name: string,
): string | undefined {
  const field = kind === 'publisher' ? 'publishers' : 'subscriptions';
  for (const [backend, entry] of Object.entries(config?.backends ?? {})) {
    if (entry[field] && Object.hasOwn(entry[field], name)) return backend;
  }
  return undefined;
}

/** The binding options a backend declares for a logical name, `{}` when it binds the name implicitly. */
export function bindingOptions(
  entry: MessageBrokerBackendEntry,
  kind: BindingKind,
  name: string,
): Readonly<Record<string, unknown>> {
  const section = kind === 'publisher' ? entry.publishers : entry.subscriptions;
  return section && Object.hasOwn(section, name) ? section[name] : {};
}
