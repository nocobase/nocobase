/**
 * A runner's slots, shared by everything it holds: its agent runs and its jobs. A claim reads `used` inside its
 * claiming transaction before it takes anything.
 */
import type { DatabaseConnection } from '@nocobase/db';

import { ACTIVE_JOB, activeJobsOn, jobsRepo } from '../jobs/job.store.js';

export interface Slots {
  /** What `runnerId` holds now, of every kind. */
  used(conn: DatabaseConnection, runnerId: string): Promise<number>;
  /** What `runnerId` holds now, jobs and runs apart. */
  held(
    conn: DatabaseConnection,
    runnerId: string,
  ): Promise<{ readonly jobs: number; readonly runs: number }>;
  /** The jobs each runner holds now, by runner id; a runner holding none is left out. */
  jobsByRunner(conn: DatabaseConnection): Promise<ReadonlyMap<string, number>>;
}

/** `runsHeld` counts the runs each of the runners holds now. */
export function createSlots(
  runsHeld: (
    conn: DatabaseConnection,
    runnerIds: readonly string[],
  ) => Promise<ReadonlyMap<string, number>>,
): Slots {
  const held: Slots['held'] = async (conn, runnerId) => ({
    jobs: await activeJobsOn(conn, runnerId),
    runs: (await runsHeld(conn, [runnerId])).get(runnerId) ?? 0,
  });
  return {
    held,
    async jobsByRunner(conn) {
      const jobs = await jobsRepo(conn).findMany({
        filter: (f) =>
          f.or(ACTIVE_JOB.map((status) => f.string('status').eq(status))),
      });
      const counts = new Map<string, number>();
      for (const job of jobs)
        if (job.runnerId)
          counts.set(job.runnerId, (counts.get(job.runnerId) ?? 0) + 1);
      return counts;
    },
    async used(conn, runnerId) {
      const { jobs, runs } = await held(conn, runnerId);
      return jobs + runs;
    },
  };
}
