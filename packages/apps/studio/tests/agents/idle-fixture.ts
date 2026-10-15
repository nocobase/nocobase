import type { BridgeHarness } from './bridge-harness.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
export async function idleFixture(h: BridgeHarness) {
  const issue = await h.projects.issues.create(h.viewer('alice'), {
    title: 'Structured idle',
    statusKey: 'in_progress',
    executor: { type: 'agent', id: PROJECT_MANAGER_ID },
    start: false,
  });
  const queued = await h.agents.runs.enqueue({
    agentId: PROJECT_MANAGER_ID,
    subject: { kind: 'issue', id: issue.id },
    actorUserId: 'alice',
    ownerUserId: 'alice',
    input: {
      type: 'signal',
      actor: { kind: 'system', id: 'system', name: 'Test' },
      text: 'Initial work',
    },
  });
  if (queued.outcome === 'pending')
    throw new Error('The idle fixture must enqueue manager work directly.');
  const conn = h.database.connection();
  const finishedAt = new Date(Date.now() - 16 * 60_000);
  const before = new Date(finishedAt.getTime() - 1000);
  await conn.repository('pmIssues').updateMany({
    filter: { id: issue.id },
    values: { lastActivityAt: before },
  });
  await conn.repository('pmActivities').updateMany({
    filter: { issueId: issue.id },
    values: { createdAt: before },
  });
  await conn.repository('agRuns').updateMany({
    filter: { id: queued.runId },
    values: {
      status: 'completed',
      createdAt: before,
      startedAt: before,
      finishedAt,
    },
  });
  await conn.repository('agRunInputs').updateMany({
    filter: { runId: queued.runId },
    values: { createdAt: before },
  });
  return { issue, managerRunId: queued.runId, finishedAt };
}
