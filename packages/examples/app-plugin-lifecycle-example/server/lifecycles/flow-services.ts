import {
  LifecycleError,
  type InputProblem,
  type JsonObject,
  type RecordId,
} from '@nocobase/lifecycle';

import { person } from '../../shared/people.js';
import { text } from '../../shared/text.js';
import type { Sandbox } from '../sandbox/sandbox.js';

/**
 * What the durable flows' effects call: the sandbox standing in for the
 * systems outside the application, the example's failure switch, and a way
 * to fire a transition from an effect that decides for itself what follows.
 */
export interface FlowServices {
  readonly sandbox: Sandbox;
  /**
   * True for the first `times` calls under `key`, counted in this process:
   * the example's switch for outages that a retry gets past.
   */
  shouldFail(key: string, times: number): boolean;
  /**
   * Fires a transition as the system. An effect uses it when what follows
   * depends on what it found — a polled job that may still be running —
   * so a fixed `onSuccess` would not do.
   */
  fire(
    lifecycle: string,
    id: RecordId,
    transition: string,
    options: { readonly input?: JsonObject; readonly requestId: string },
  ): Promise<void>;
}

/** The example's outage switch, counted per key across attempts and retries alike. */
export function createFailureSwitch(): FlowServices['shouldFail'] {
  const calls = new Map<string, number>();
  return (key, times) => {
    const count = (calls.get(key) ?? 0) + 1;
    calls.set(key, count);
    return count <= times;
  };
}

/**
 * Fires through `services.fire` and treats "the record has moved on" as nothing to
 * do: the record left the state while the effect ran, or the same outcome
 * was fired already.
 */
export async function fireIfStill(
  services: Pick<FlowServices, 'fire'>,
  lifecycle: string,
  id: RecordId,
  transition: string,
  options: { readonly input?: JsonObject; readonly requestId: string },
): Promise<boolean> {
  try {
    await services.fire(lifecycle, id, transition, options);
    return true;
  } catch (error) {
    if (
      error instanceof LifecycleError &&
      (error.code === 'INVALID_STATE' || error.code === 'REQUEST_REUSED')
    )
      return false;
    // A conflict or a failure: the effect fails, and its retry looks again.
    throw error;
  }
}

/** The customer a record is for: one of the example's customers. */
export function customerProblems(
  values: Readonly<Record<string, unknown>>,
): InputProblem[] {
  return person(values.customerId)?.role === 'customer'
    ? []
    : [{ field: 'customerId', message: 'Choose the customer.' }];
}

/** A non-empty string field, reported under its name. */
export function required(
  values: Readonly<Record<string, unknown>>,
  field: string,
  message: string,
): InputProblem[] {
  return text(values[field]).trim() ? [] : [{ field, message }];
}

/**
 * A stored time in milliseconds, or NaN without one. A datetime column reads
 * back as a string on some dialects and as a Date on others.
 */
export function millis(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  return typeof value === 'string' ? Date.parse(value) : NaN;
}

/** An error an effect reported, as the record keeps it. */
export function errorText(input: JsonObject): string {
  return text(input.error) || 'Unknown error.';
}
