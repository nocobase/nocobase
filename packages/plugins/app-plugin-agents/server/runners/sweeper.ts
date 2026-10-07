/**
 * The sweeper: marks runners not heard from for `TIMINGS.offlineAfterMs` offline, then takes back what runners that
 * went away held and ends what nobody will end: the agent runs (`core/runs/sweeper.ts`) and the jobs (`jobs.sweep`).
 * It runs on a timer (the `AgentsSweep` task, every 30 seconds) and is safe to run on several instances at once: every
 * move is a guarded update, so something another instance (or its runner) moved first is left alone.
 */
import { TIMINGS } from '@nocobase/agent-protocol';

import type { Sweeper as RunSweeper } from '../core/runs/sweeper.js';
import type { JobService, JobSweepReport } from '../jobs/index.js';
import type { Clock } from '../kernel/clock.js';
import type { RunnerService } from './runner.service.js';

export interface SweepReport {
  readonly runnersOffline: number;
  readonly requeued: number;
  readonly failed: number;
  readonly cancelled: number;
  readonly jobs: JobSweepReport;
}

export interface RunnerSweeper {
  sweep(): Promise<SweepReport>;
}

export function createRunnerSweeper(deps: {
  readonly clock: Clock;
  readonly runners: Pick<RunnerService, 'markOffline'>;
  readonly runs: RunSweeper;
  readonly jobs: Pick<JobService, 'sweep'>;
}): RunnerSweeper {
  return {
    async sweep() {
      const now = deps.clock.now();
      const runnersOffline = (
        await deps.runners.markOffline(
          new Date(now.getTime() - TIMINGS.offlineAfterMs),
        )
      ).length;
      const runs = await deps.runs.sweep();
      const jobs = await deps.jobs.sweep();
      return { runnersOffline, ...runs, jobs };
    },
  };
}
