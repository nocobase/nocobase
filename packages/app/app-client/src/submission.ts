import { useMemo, useSyncExternalStore } from 'react';
import { sha256 } from '@noble/hashes/sha2.js';
import { ApiClientError, createOperationKey } from '@nocobase/api-client';

export interface SubmissionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export interface SubmissionOptions {
  /** Stable per identity, operation and form instance. Never use a shared scope across independent forms. */
  readonly scope?: string;
  readonly storage?: SubmissionStorage;
  /** Maximum foreground wait; timeout retains the original operation for safe retry. */
  readonly timeoutMs?: number;
}
interface PendingOperation {
  key: string;
  digest: string;
}
export class SubmissionTimeoutError extends Error {
  constructor() {
    super(
      'The operation result is unknown. Retry the original operation to confirm it.',
    );
  }
}
export class PendingSubmissionError extends Error {
  constructor() {
    super(
      'Retry the original operation to confirm its outcome before changing it.',
    );
  }
}

function fingerprint(input: unknown): string {
  const canonical = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonical);
    if (value instanceof Date) return value.toJSON();
    if (value && typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value)
          .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
          .map(([key, value]) => [key, canonical(value)]),
      );
    return value;
  };
  // SHA-256 is computed without WebCrypto's HTTPS-only subtle API.
  const json = JSON.stringify(canonical(input));
  return Array.from(sha256(new TextEncoder().encode(json)), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
}

/** Own one controller per form. Every entry point must call run(), before asynchronous validation. */
export class SubmissionController {
  private busy = false;
  private pending?: PendingOperation;
  private listeners = new Set<() => void>();
  private readonly storage?: SubmissionStorage;
  private readonly storageKey?: string;
  private readonly timeoutMs: number;
  constructor(options: SubmissionOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 30_000;
    if (
      !Number.isSafeInteger(this.timeoutMs) ||
      this.timeoutMs < 1 ||
      this.timeoutMs > 2_147_483_647
    )
      throw new Error('Submission timeout must be a positive timer duration.');
    this.storageKey = options.scope
      ? `nocobase:submission:${options.scope}`
      : undefined;
    this.storage = options.storage;
    if (this.storageKey && this.storage) {
      try {
        const saved: unknown = JSON.parse(
          this.storage.getItem(this.storageKey) ?? 'null',
        );
        if (
          saved &&
          typeof saved === 'object' &&
          'key' in saved &&
          typeof saved.key === 'string' &&
          'digest' in saved &&
          typeof saved.digest === 'string'
        )
          this.pending = { key: saved.key, digest: saved.digest };
      } catch {
        /* Storage may be unavailable; no form values are persisted. */
      }
    }
  }
  readonly getSnapshot = (): boolean => this.busy;
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private publish(): void {
    for (const listener of this.listeners) listener();
  }
  private save(): void {
    if (!this.storageKey || !this.storage) return;
    try {
      if (this.pending)
        this.storage.setItem(this.storageKey, JSON.stringify(this.pending));
      else this.storage.removeItem(this.storageKey);
    } catch {
      /* A blocked session store does not prevent submitting. */
    }
  }
  /** Call only after the original result has been confirmed through an authoritative business read or manual reconciliation. */
  acknowledgeOutcome(outcome: 'committed' | 'not-committed'): void {
    if (this.busy)
      throw new Error(
        'Wait for the active attempt before acknowledging its outcome.',
      );
    if (outcome !== 'committed' && outcome !== 'not-committed')
      throw new Error('An operation outcome must be confirmed.');
    this.pending = undefined;
    this.save();
  }
  async run<T>(
    input: unknown,
    execute: (key: string, signal: AbortSignal) => Promise<T>,
  ): Promise<T | undefined> {
    if (this.busy) return undefined;
    const recovering = this.pending !== undefined;
    this.busy = true;
    this.publish();
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const digest = fingerprint(input);
      if (this.pending && this.pending.digest !== digest)
        throw new PendingSubmissionError();
      this.pending ??= { key: createOperationKey(), digest };
      this.save();
      const result = await Promise.race([
        execute(this.pending.key, abort.signal),
        new Promise<never>((_resolve, reject) => {
          timer = setTimeout(() => {
            abort.abort();
            reject(new SubmissionTimeoutError());
          }, this.timeoutMs);
        }),
      ]);
      this.pending = undefined;
      this.save();
      return result;
    } catch (error) {
      // A known request rejection did not commit. Transport failures and opaque server errors keep the original key.
      if (
        !recovering &&
        error instanceof ApiClientError &&
        error.status >= 400 &&
        error.status < 500 &&
        ![
          'OPERATION_EXPIRED',
          'OPERATION_CONFLICT',
          'REQUEST_TIMEOUT',
        ].includes(error.reason ?? '')
      ) {
        this.pending = undefined;
        this.save();
      }
      throw error;
    } finally {
      clearTimeout(timer);
      this.busy = false;
      this.publish();
    }
  }
}

export interface Submission {
  readonly submitting: boolean;
  readonly run: SubmissionController['run'];
  readonly acknowledgeOutcome: SubmissionController['acknowledgeOutcome'];
}
export function useSubmission(options: SubmissionOptions = {}): Submission {
  const controller = useMemo(() => {
    let storage = options.storage;
    if (!storage && typeof window !== 'undefined') {
      try {
        storage = window.sessionStorage;
      } catch {
        /* Storage access can be blocked by the browser. */
      }
    }
    return new SubmissionController({
      scope: options.scope,
      storage,
      timeoutMs: options.timeoutMs,
    });
  }, [options.scope, options.storage, options.timeoutMs]);
  const submitting = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  return {
    submitting,
    run: controller.run.bind(controller),
    acknowledgeOutcome: controller.acknowledgeOutcome.bind(controller),
  };
}
