/** The `messageBrokerOutbox` configuration section; every field is optional. */
export interface MessageBrokerOutboxConfig {
  /** Milliseconds between the relay's fallback polls. Defaults to 5 seconds. */
  readonly pollInterval?: number;
  /** Milliseconds sent outbox rows are kept; `0` deletes them at the next hourly cleanup. Defaults to 1 day. */
  readonly outboxRetention?: number;
  /** Milliseconds inbox rows are kept, the window in which a repeated messageId is skipped. Defaults to 7 days. */
  readonly inboxRetention?: number;
}

export interface ResolvedMessageBrokerOutboxConfig {
  readonly pollInterval: number;
  readonly outboxRetention: number;
  readonly inboxRetention: number;
}

const DAY = 24 * 60 * 60 * 1000;

const DEFAULTS: ResolvedMessageBrokerOutboxConfig = {
  pollInterval: 5000,
  outboxRetention: DAY,
  inboxRetention: 7 * DAY,
};

export function resolveMessageBrokerOutboxConfig(
  config: MessageBrokerOutboxConfig | undefined,
): ResolvedMessageBrokerOutboxConfig {
  const value = config ?? {};
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError('messageBrokerOutbox must be an object.');
  }
  const resolved = { ...DEFAULTS };
  for (const field of Object.keys(value)) {
    if (!(field in DEFAULTS)) {
      throw new TypeError(
        `messageBrokerOutbox has an unknown field "${field}".`,
      );
    }
    const number = (value as Record<string, unknown>)[field];
    const minimum = field === 'pollInterval' ? 1 : 0;
    if (
      typeof number !== 'number' ||
      !Number.isInteger(number) ||
      number < minimum
    ) {
      throw new TypeError(
        `messageBrokerOutbox.${field} must be an integer of at least ${minimum} milliseconds.`,
      );
    }
    (resolved as Record<string, number>)[field] = number;
  }
  return resolved;
}
