import { executableRunnerEntries, type Agent } from '../../../shared/agents.js';
import type { Tx } from '../../kernel/tx.js';
import { runsRepo } from './run.store.js';

/** Releases waiting inputs only after an explicit model has been saved. Held runs keep their execution configuration. */
export async function modelsConfigured(unit: Tx, agent: Agent): Promise<void> {
  if (agent.type !== 'runner' || executableRunnerEntries(agent).length === 0)
    return;
  const waiting = await runsRepo(unit.conn).findMany({
    filter: { agentId: agent.id, status: 'queued', modelPending: true },
  });
  await runsRepo(unit.conn).updateMany({
    filter: { agentId: agent.id, status: 'queued', modelPending: true },
    values: { modelPending: false, updatedAt: agent.updatedAt },
  });
  for (const run of waiting)
    unit.emit({ type: 'run.changed', runId: run.id, status: 'queued' });
}
