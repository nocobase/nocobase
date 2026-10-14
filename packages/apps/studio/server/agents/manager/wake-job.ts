/** Timers only accelerate work: the database owns retries and idle deduplication across instances. */
import type { ScheduleExecutor } from '@nocobase/jobs';

export async function scheduleManagerWake(
  execute: () => Promise<void>,
  executor: ScheduleExecutor | null,
  onError: (error: unknown) => void,
): Promise<() => Promise<void>> {
  if (executor) {
    await executor.addJob({
      name: 'ManagerWake',
      options: { cron: '* * * * *' },
      payload: {},
      execute,
    });
    await executor.setup();
    return () => executor.shutdown();
  }
  const timer = setInterval(() => void execute().catch(onError), 60_000);
  timer.unref();
  return () => {
    clearInterval(timer);
    return Promise.resolve();
  };
}
