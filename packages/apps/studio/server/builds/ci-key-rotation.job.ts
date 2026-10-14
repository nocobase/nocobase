/**
 * The daily rotation of the API keys Studio keeps as repositories' CI secrets (`ci-setup.ts`, `rotateExpiring`): every
 * key expiring within 14 days gets a new secret, written to its repository at once; a failure is recorded on the
 * repository and its project's lead and the administrators are told.
 *
 * It runs as the `CiKeyRotation` schedule on the application's jobs service (one instance at a time), at 03:17 UTC
 * every day; without a jobs service an in-process timer runs it daily instead, which is safe on several instances, as
 * a rotation only ever renews a key that is due.
 */
import type { ScheduleExecutor } from '@nocobase/jobs';

import type { CiSetup } from './ci-setup.js';

/** The schedule's stable identity in Studio's scope. */
export const CI_KEY_ROTATION_SCHEDULE = 'CiKeyRotation';
/** Studio's scope on the jobs service. */
export const CI_JOBS_SCOPE = 'studio';
const DAILY = '17 3 * * *';
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Schedules the rotation on `executor` (null: an in-process timer). Returns what stops it; the rule stays in the
 * backend for the other instances.
 */
export async function scheduleCiKeyRotation(
  ci: () => Pick<CiSetup, 'rotateExpiring'>,
  executor: ScheduleExecutor | null,
): Promise<() => Promise<void>> {
  const rotate = async () => {
    await ci().rotateExpiring();
  };
  if (executor) {
    await executor.addJob({
      name: CI_KEY_ROTATION_SCHEDULE,
      options: { cron: DAILY },
      payload: {},
      execute: rotate,
    });
    await executor.setup();
    return () => executor.shutdown();
  }
  const timer = setInterval(() => void rotate(), DAY_MS);
  timer.unref();
  return () => {
    clearInterval(timer);
    return Promise.resolve();
  };
}
