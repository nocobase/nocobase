/**
 * The hourly removal of the webhook delivery ids older than `WEBHOOK_RETENTION_DAYS` (`webhooks.ts`), kept only to act
 * on a redelivered webhook once. It used to run on every delivery, a delete per event even for the ones Studio ignores.
 *
 * It runs as the `GitDeliveryPurge` schedule on the application's jobs service (one instance at a time), at minute 23
 * of every hour; without a jobs service an in-process timer runs it hourly instead, which is safe on several
 * instances, as removing what is already gone does nothing.
 */
import type { DatabaseConnection } from '@nocobase/db';
import type { ScheduleExecutor } from '@nocobase/jobs';

import { purgeDeliveries } from './store.js';
import { WEBHOOK_RETENTION_DAYS } from './webhooks.js';

/** The schedule's stable identity in its scope. */
export const GIT_DELIVERY_PURGE_SCHEDULE = 'GitDeliveryPurge';
/** Studio's git scope on the jobs service. */
export const GIT_JOBS_SCOPE = 'studio-git';
const HOURLY = '23 * * * *';
const HOUR_MS = 60 * 60 * 1000;

/** Removes the delivery ids received more than `WEBHOOK_RETENTION_DAYS` before `now`. */
export async function purgeExpiredDeliveries(
  conn: DatabaseConnection,
  now: Date,
): Promise<void> {
  await purgeDeliveries(
    conn,
    new Date(now.getTime() - WEBHOOK_RETENTION_DAYS * 24 * HOUR_MS),
  );
}

/**
 * Schedules the purge on `executor` (null: an in-process timer). Returns what stops it; the rule stays in the backend
 * for the other instances.
 */
export async function scheduleDeliveryPurge(
  conn: () => DatabaseConnection,
  executor: ScheduleExecutor | null,
  onError: (error: unknown) => void,
): Promise<() => Promise<void>> {
  const purge = () => purgeExpiredDeliveries(conn(), new Date());
  if (executor) {
    await executor.addJob({
      name: GIT_DELIVERY_PURGE_SCHEDULE,
      options: { cron: HOURLY },
      payload: {},
      execute: purge,
    });
    await executor.setup();
    return () => executor.shutdown();
  }
  const timer = setInterval(() => void purge().catch(onError), HOUR_MS);
  timer.unref();
  return () => {
    clearInterval(timer);
    return Promise.resolve();
  };
}
