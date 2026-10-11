import {
  policyAllowsAgent,
  type AgentTool,
  type RunnerFeature,
} from '@nocobase/agent-protocol';
import type { DatabaseConnection } from '@nocobase/db';

import { runnerEntries, type Agent } from '../../../shared/agents.js';
import { toolLimit, type Runner } from '../../../shared/runners.js';
import type { ToolAvailability } from '../../../shared/runs.js';
import type { ClaimEligibility } from './eligibility.js';
import { ACTIVE, runsRepo } from './run.store.js';
import { explainWait, type WorkloadRunners } from './workload.js';

/** A read-only preview for this actor. Never exposes another person's private runner, even when no runner fits. */
export async function readToolAvailability(
  conn: DatabaseConnection,
  agent: Agent,
  tool: AgentTool,
  userId: string,
  requires: readonly RunnerFeature[],
  source: WorkloadRunners,
  eligibility: Pick<ClaimEligibility, 'runnersFor' | 'requirements'>,
  now: Date,
): Promise<ToolAvailability> {
  const selected: Agent = {
    ...agent,
    modelEntries: runnerEntries(agent).filter((entry) => entry.tool === tool),
  };
  const entry = runnerEntries(selected)[0];
  const online = (await source.all(conn)).filter(
    (runner) =>
      runner.status === 'online' &&
      (runner.trust === 'team' || runner.ownerUserId === userId) &&
      policyAllowsAgent(runner.policy, selected),
  );
  const facts = await eligibility.requirements(conn, selected, {
    actorUserId: userId,
    requires,
  });
  const held = await runsRepo(conn).findMany({
    filter: (f) => f.or(ACTIVE.map((status) => f.string('status').eq(status))),
  });
  const jobs = await source.jobsByRunner(conn);
  const used = new Map(jobs);
  const byTool = new Map<string, Partial<Record<AgentTool, number>>>();
  for (const run of held) {
    if (!run.runnerId) continue;
    used.set(run.runnerId, (used.get(run.runnerId) ?? 0) + 1);
    if (run.tool) {
      const counts = byTool.get(run.runnerId) ?? {};
      const activeTool = run.tool as AgentTool;
      counts[activeTool] = (counts[activeTool] ?? 0) + 1;
      byTool.set(run.runnerId, counts);
    }
  }
  const wait = explainWait(
    {
      actorUserId: userId,
      requestedTool: tool,
      availableAt: null,
      claimFailures: 0,
      failureDetail: null,
      requires: facts.requires,
      teamOnlyVariables: facts.teamOnly,
    },
    {
      now,
      agent: selected,
      runners: online,
      runnerUsed: used,
      runnerToolUsed: byTool,
      agentActive: held.filter((run) => run.agentId === agent.id).length,
      sameWorkActive: false,
    },
  );
  const fitting: Runner[] = await eligibility.runnersFor(conn, selected, {
    actorUserId: userId,
    requires,
    runners: online,
  });
  return {
    agentId: agent.id,
    tool,
    model: entry.model,
    effort: entry.effort ?? null,
    available: wait.reason === 'next',
    wait,
    runners: fitting.map((runner) => ({
      id: runner.id,
      name: runner.name,
      slots: { used: used.get(runner.id) ?? 0, limit: runner.slots },
      toolSlots: {
        limit: Number.isFinite(toolLimit(runner, tool))
          ? Math.min(
              toolLimit(runner, tool),
              runner.toolLoad?.[tool]?.slots ?? Number.POSITIVE_INFINITY,
            )
          : (runner.toolLoad?.[tool]?.slots ?? null),
        used: Math.max(
          byTool.get(runner.id)?.[tool] ?? 0,
          (runner.toolLoad?.[tool]?.slots ?? 0) -
            (runner.toolLoad?.[tool]?.free ?? 0),
        ),
      },
    })),
  };
}
