/**
 * A runner's slots, shared by everything it holds: its agent runs and its jobs. A claim reads `used` inside its
 * claiming transaction before it takes anything.
 */
import type { AgentTool } from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';

import { ACTIVE_JOB, activeJobsOn, jobsRepo } from '../jobs/job.store.js';

export interface HeldItems {
  readonly jobs: number;
  readonly runs: number;
  /**
   * The runs by the coding tool each runs with; a tool it runs nothing of is left out. Optional so a `Slots` written
   * elsewhere needs none; `createSlots` always counts it.
   */
  readonly byTool?: Readonly<Partial<Record<AgentTool, number>>>;
}

export interface Slots {
  /** What `runnerId` holds now, of every kind. */
  used(conn: DatabaseConnection, runnerId: string): Promise<number>;
  /** What `runnerId` holds now, jobs and runs apart, and its runs by coding tool. */
  held(conn: DatabaseConnection, runnerId: string): Promise<HeldItems>;
  /** The jobs each runner holds now, by runner id; a runner holding none is left out. */
  jobsByRunner(conn: DatabaseConnection): Promise<ReadonlyMap<string, number>>;
}

/** `runsHeld` counts the runs each of the runners holds now, `runsByTool` one runner's by coding tool. */
export function createSlots(
  runsHeld: (
    conn: DatabaseConnection,
    runnerIds: readonly string[],
  ) => Promise<ReadonlyMap<string, number>>,
  runsByTool: (
    conn: DatabaseConnection,
    runnerId: string,
  ) => Promise<Partial<Record<AgentTool, number>>>,
): Slots {
  const held: Slots['held'] = async (conn, runnerId) => ({
    jobs: await activeJobsOn(conn, runnerId),
    runs: (await runsHeld(conn, [runnerId])).get(runnerId) ?? 0,
    byTool: await runsByTool(conn, runnerId),
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
