export type JsonPrimitive = null | boolean | number | string;
export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;
export interface JsonObject {
  [key: string]: JsonValue;
}

export type RecordId = string | number;

/** The business record a lifecycle runs on. Its state lives in one of its own fields. */
export interface LifecycleRecord {
  readonly id: RecordId;
  readonly [field: string]: unknown;
}

/** Who fired a transition. Triggers and effect callbacks fire as {@link SYSTEM_ACTOR}. */
export interface LifecycleActor {
  readonly id: string;
  readonly system?: boolean;
}

export const SYSTEM_ACTOR: LifecycleActor = Object.freeze({
  id: 'system',
  system: true,
});

/**
 * The types one lifecycle works with, named once so every callback is typed
 * without repeating four generic arguments.
 *
 * ```ts
 * interface TicketTypes {
 *   record: Ticket;
 *   state: 'open' | 'awaitingCustomer' | 'closed';
 *   parameters: { waitMinutes: number };
 * }
 * ```
 */
export interface LifecycleTypes {
  record: LifecycleRecord;
  state: string;
  parameters?: object;
  services?: object;
}

export type ParametersOf<T extends LifecycleTypes> = T extends {
  parameters: infer P extends object;
}
  ? P
  : Record<string, never>;

export type ServicesOf<T extends LifecycleTypes> = T extends {
  services: infer S extends object;
}
  ? S
  : Record<string, never>;

export type OneOrMany<T> = T | readonly T[];
