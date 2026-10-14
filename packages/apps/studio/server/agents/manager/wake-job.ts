/** Existing run/input facts deduplicate periodic idle checks across instances. */
import type { ScheduleExecutor } from '@nocobase/jobs';

export async function scheduleManagerWake(
  execute: () => Promise<void>,
  executor: ScheduleExecutor | null,
  onError: (error: unknown) => void,
  intervalMinutes = 5,
): Promise<() => Promise<void>> {
  if (executor) {
    await executor.addJob({
      name: 'ManagerWake',
      options: { every: intervalMinutes * 60_000 },
      payload: {},
      execute,
    });
    await executor.setup();
    return () => executor.shutdown();
  }
  const timer = setInterval(
    () => void execute().catch(onError),
    intervalMinutes * 60_000,
  );
  timer.unref();
  return () => {
    clearInterval(timer);
    return Promise.resolve();
  };
}
