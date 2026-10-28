import { vi } from 'vitest';
import { JobsBackendRegistry } from '../../src/adapters.js';
import type { ResolvedJobsConfig } from '../../src/config.js';
import type { JobExecutor } from '../../src/job/types.js';
import type { ScheduleExecutor } from '../../src/schedule/types.js';

export function testRegistry(
  schedule: (config: ResolvedJobsConfig) => ScheduleExecutor,
  job?: (config: ResolvedJobsConfig) => JobExecutor,
): JobsBackendRegistry {
  const registry = new JobsBackendRegistry();
  registry.register({
    name: 'test',
    resolve: (raw, base) => ({ ...raw, ...base }),
    createJobExecutor: () => {
      throw new Error('unused');
    },
    createScheduleExecutor: schedule,
  });
  const select = registry.select.bind(registry);
  vi.spyOn(registry, 'select').mockImplementation((...args) => {
    const selected = select(...args);
    return {
      ...selected,
      createScheduleExecutor: () => schedule(selected.config),
      createJobExecutor: () =>
        job ? job(selected.config) : selected.createJobExecutor(),
    };
  });
  return registry;
}
