import {
  DEFAULT_GMAIL_QUOTA_UNITS_PER_PROJECT_PER_MINUTE,
  DEFAULT_GMAIL_QUOTA_UNITS_PER_USER_PER_MINUTE,
} from '../../config.js';
import type { GmailMailProviderConfig } from './types.js';

const QUOTA_HEADROOM = 0.8;
// Keep quota reservations together so cancellation reflows both limit queues.
interface QuotaLimit {
  readonly key: string;
  readonly intervalMs: number;
}

interface QuotaReservation {
  readonly limits: readonly QuotaLimit[];
  readonly signal?: AbortSignal;
  readonly resolve: () => void;
  readonly reject: (reason: unknown) => void;
  scheduledAt: number;
  timer?: ReturnType<typeof setTimeout>;
  timerAt?: number;
  abortListener?: () => void;
}

const quotaReservations: QuotaReservation[] = [];
const committedQuotaUntil = new Map<string, number>();

export async function waitForGmailQuota(
  config: GmailMailProviderConfig,
  userAddress: string,
  units: number,
  signal?: AbortSignal,
): Promise<void> {
  const perUserLimit =
    config.quota?.unitsPerUserPerMinute ??
    DEFAULT_GMAIL_QUOTA_UNITS_PER_USER_PER_MINUTE;
  const perProjectLimit =
    config.quota?.unitsPerProjectPerMinute ??
    DEFAULT_GMAIL_QUOTA_UNITS_PER_PROJECT_PER_MINUTE;
  const projectId = config.quota?.projectId?.trim() || config.clientId;
  await reserveQuota(
    [
      {
        key: `project:${projectId}`,
        intervalMs: quotaInterval(units, perProjectLimit),
      },
      {
        key: `user:${projectId}:${userAddress.trim().toLowerCase()}`,
        intervalMs: quotaInterval(units, perUserLimit),
      },
    ],
    signal,
  );
}

function reserveQuota(
  limits: readonly QuotaLimit[],
  signal?: AbortSignal,
): Promise<void> {
  if (signal?.aborted) return Promise.reject(abortReason(signal));
  return new Promise<void>((resolve, reject) => {
    const reservation: QuotaReservation = {
      limits,
      signal,
      resolve,
      reject,
      scheduledAt: Date.now(),
    };
    reservation.abortListener = (): void =>
      cancelReservation(reservation, abortReason(signal));
    quotaReservations.push(reservation);
    signal?.addEventListener('abort', reservation.abortListener, {
      once: true,
    });
    if (signal?.aborted) {
      cancelReservation(reservation, abortReason(signal));
      return;
    }
    rescheduleReservations();
  });
}

function quotaInterval(units: number, unitsPerMinute: number): number {
  return (units * 60_000) / (unitsPerMinute * QUOTA_HEADROOM);
}

function rescheduleReservations(): void {
  const now = Date.now();
  const nextAvailable = new Map(committedQuotaUntil);
  for (const reservation of quotaReservations) {
    const startsAt = reservation.limits.reduce(
      (latest, limit) => Math.max(latest, nextAvailable.get(limit.key) ?? now),
      now,
    );
    reservation.scheduledAt = startsAt;
    for (const limit of reservation.limits) {
      nextAvailable.set(limit.key, startsAt + limit.intervalMs);
    }
    if (reservation.timerAt === startsAt) continue;
    if (reservation.timer) clearTimeout(reservation.timer);
    reservation.timerAt = startsAt;
    reservation.timer = setTimeout(
      () => startReservation(reservation),
      Math.max(0, startsAt - now),
    );
  }
}

function startReservation(reservation: QuotaReservation): void {
  reservation.timer = undefined;
  reservation.timerAt = undefined;
  if (!quotaReservations.includes(reservation)) return;
  if (reservation.signal?.aborted) {
    cancelReservation(reservation, abortReason(reservation.signal));
    return;
  }
  rescheduleReservations();
  if (!quotaReservations.includes(reservation)) return;
  if (reservation.scheduledAt > Date.now()) return;

  const startedAt = Date.now();
  for (const limit of reservation.limits) {
    committedQuotaUntil.set(
      limit.key,
      Math.max(
        committedQuotaUntil.get(limit.key) ?? 0,
        startedAt + limit.intervalMs,
      ),
    );
  }
  removeReservation(reservation);
  reservation.resolve();
  rescheduleReservations();
}

function cancelReservation(
  reservation: QuotaReservation,
  reason: unknown,
): void {
  if (!quotaReservations.includes(reservation)) return;
  removeReservation(reservation);
  reservation.reject(reason);
  rescheduleReservations();
}

function removeReservation(reservation: QuotaReservation): void {
  const index = quotaReservations.indexOf(reservation);
  if (index >= 0) quotaReservations.splice(index, 1);
  if (reservation.timer) clearTimeout(reservation.timer);
  reservation.timer = undefined;
  reservation.timerAt = undefined;
  if (reservation.abortListener) {
    reservation.signal?.removeEventListener('abort', reservation.abortListener);
    reservation.abortListener = undefined;
  }
}

function abortReason(signal?: AbortSignal): Error {
  return signal?.reason instanceof Error
    ? signal.reason
    : Object.assign(new Error('Aborted'), { name: 'AbortError' });
}
