import {
  APP_ACTIVATIONS,
  APP_POLICY_LIMITS,
  LABEL_KEY_PATTERN,
  MAX_LABEL_VALUE_LENGTH,
  MAX_LABELS,
  type AppActivation,
  type AppRuntimePolicy,
  type Labels,
} from '../../shared/releases.js';
import { ReleasesError } from '../errors.js';

export const APP_ID_PATTERN: RegExp = /^[a-zA-Z0-9_-]{1,128}$/;
const ENVIRONMENT_ID_PATTERN = /^[a-z0-9][a-z0-9_-]{0,63}$/;

const RESERVED_APP_IDS: readonly string[] = ['new', 'requests'];

export function assertAppId(id: string): void {
  if (!APP_ID_PATTERN.test(id))
    throw new ReleasesError(
      'App ID may contain only letters, numbers, underscores, and hyphens (at most 128).',
      'INVALID_APP_ID',
      'INVALID_ARGUMENT',
    );
  // App Host reserves the /__ namespace for listener-owned routes.
  if (id.startsWith('__'))
    throw new ReleasesError(
      'App IDs beginning with "__" are reserved.',
      'INVALID_APP_ID',
      'INVALID_ARGUMENT',
    );
  // `new` (Create App) and `requests` (a deployment request) are segments beside `:appId` in the pages.
  if (RESERVED_APP_IDS.includes(id))
    throw new ReleasesError(
      `App ID may not be "${id}".`,
      'INVALID_APP_ID',
      'INVALID_ARGUMENT',
    );
}

/** `check` is a fixed segment beside the ID in `/environments/check` and `/registries/check`. */
const RESERVED_SETTING_IDS: readonly string[] = ['check'];

export function assertEnvironmentId(id: string): void {
  if (!ENVIRONMENT_ID_PATTERN.test(id) || RESERVED_SETTING_IDS.includes(id))
    throw new ReleasesError(
      'Environment ID may contain only lowercase letters, numbers, underscores and hyphens, and may not be "check".',
      'INVALID_ENVIRONMENT_ID',
      'INVALID_ARGUMENT',
    );
}

export function normalizeName(value: unknown, code: string): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 255)
    throw new ReleasesError(
      'A name of 1 to 255 characters is required.',
      code,
      'INVALID_ARGUMENT',
    );
  return value.trim();
}

/** Checks opaque labels: at most 32, keys like `issue` or `acme.io/branch`, string values up to 255 characters. */
export function normalizeLabels(value: unknown): Labels {
  if (value === undefined || value === null) return {};
  if (typeof value !== 'object' || Array.isArray(value))
    throw new ReleasesError(
      'Labels must be an object of strings.',
      'INVALID_LABELS',
      'INVALID_ARGUMENT',
    );
  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length > MAX_LABELS)
    throw new ReleasesError(
      `At most ${MAX_LABELS} labels are allowed.`,
      'INVALID_LABELS',
      'INVALID_ARGUMENT',
    );
  for (const [key, label] of entries)
    if (
      !LABEL_KEY_PATTERN.test(key) ||
      typeof label !== 'string' ||
      label.length > MAX_LABEL_VALUE_LENGTH
    )
      throw new ReleasesError(
        `Invalid label "${key}".`,
        'INVALID_LABELS',
        'INVALID_ARGUMENT',
      );
  return Object.fromEntries(entries) as Labels;
}

/** Parses `key=value` filters from a query string (`label=issue=FG-12&label=branch=main`). */
export function parseLabelFilter(
  values: readonly string[],
): Labels | undefined {
  if (values.length === 0) return undefined;
  const labels: Record<string, string> = {};
  for (const value of values) {
    const index = value.indexOf('=');
    if (index < 1)
      throw new ReleasesError(
        'Label filters take the form key=value.',
        'INVALID_LABELS',
        'INVALID_ARGUMENT',
      );
    labels[value.slice(0, index)] = value.slice(index + 1);
  }
  return labels;
}

export function assertPagination(page: number, pageSize: number): void {
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  )
    throw new ReleasesError(
      'Page must be a positive integer and pageSize must be between 1 and 100.',
      'INVALID_PAGINATION',
      'INVALID_ARGUMENT',
    );
}

export function positiveInteger(
  value: unknown,
  code: string,
  max: number,
): number {
  if (
    typeof value !== 'number' ||
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > max
  )
    throw new ReleasesError(
      `Expected a whole number from 1 to ${max}.`,
      code,
      'INVALID_ARGUMENT',
    );
  return value;
}

/**
 * The runtime policy `input` asks for, over `previous`: a field left out keeps its value, `null` turns a timer off.
 * Dormancy must come after the idle stop, since a dormant App is a stopped one.
 */
export function normalizeRuntimePolicy(
  input: {
    readonly activation?: unknown;
    readonly idleStopMinutes?: unknown;
    readonly dormantAfterHours?: unknown;
  },
  previous: AppRuntimePolicy,
): AppRuntimePolicy {
  let activation = previous.activation;
  if (input.activation !== undefined) {
    if (!APP_ACTIVATIONS.includes(input.activation as AppActivation))
      throw new ReleasesError(
        'Activation must be eager or onDemand.',
        'INVALID_ACTIVATION_POLICY',
        'INVALID_ARGUMENT',
      );
    activation = input.activation as AppActivation;
  }
  let idleStopMinutes = previous.idleStopMinutes;
  if (input.idleStopMinutes !== undefined) {
    const limit = APP_POLICY_LIMITS.idleStopMinutes;
    idleStopMinutes =
      input.idleStopMinutes === null
        ? null
        : positiveInteger(
            input.idleStopMinutes,
            'INVALID_IDLE_STOP',
            limit.max,
          );
  }
  let dormantAfterHours = previous.dormantAfterHours;
  if (input.dormantAfterHours !== undefined) {
    const limit = APP_POLICY_LIMITS.dormantAfterHours;
    const value = input.dormantAfterHours;
    if (value === null) dormantAfterHours = null;
    else if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < limit.min - 1e-9 ||
      value > limit.max
    )
      throw new ReleasesError(
        `Dormancy must be between one minute and ${limit.max} hours.`,
        'INVALID_DORMANCY',
        'INVALID_ARGUMENT',
      );
    else dormantAfterHours = value;
  }
  if (
    idleStopMinutes !== null &&
    dormantAfterHours !== null &&
    dormantAfterHours * 60 <= idleStopMinutes
  )
    throw new ReleasesError(
      'An App becomes dormant only after it stopped: dormancy must be longer than the idle stop.',
      'INVALID_DORMANCY',
      'INVALID_ARGUMENT',
    );
  return { activation, idleStopMinutes, dormantAfterHours };
}
