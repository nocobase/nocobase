// @vitest-environment node
/**
 * An agent that reports itself blocked: the issue's owner gets a decision card with the agent's question, which settles
 * once someone answers it, unblocks the issue or gives it to someone else. A failed run's card folds away once its
 * issue moves on.
 */
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import type { WorkflowDefinition } from '@nocobase/app-plugin-projects/shared/workflows';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AGENT_BLOCKED } from '../../server/agents/blocked.js';
import { RUN_FAILED_FINAL } from '../../server/agents/notices.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
let planned: { type: string; [key: string]: unknown }[];
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id);
  planned = [];
  h.projects.events.on('notice.planned', (event) => {
    planned.push(event.notice as never);
  });
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');
const bob = () => h.viewer('bob');

/** Lets agents move issues to Blocked, as the "Software development" template does. */
async function letAgentsBlock(): Promise<void> {
  h.roles.set('alice', 'admin');
  const created = await h.projects.workflows.create(alice(), {
    name: 'Standard',
    copyFrom: null,
  });
  const workflow = await h.projects.workflows.setDefault(alice(), created.id);
  const definition: WorkflowDefinition = {
    states: workflow.definition.states,
    transitions: [
      ...workflow.definition.transitions,
      { from: '*', to: 'blocked', actors: ['agent'] },
    ],
  };
  await h.projects.workflows.update(alice(), workflow.id, {
    revision: workflow.revision,
    definition,
  });
  h.roles.delete('alice');
}

async function update(
  issue: Issue,
  patch: Record<string, unknown>,
  viewer = alice(),
) {
  const current = await h.projects.issueQueries.detail(viewer, issue.id);
  return h.projects.issues.update(viewer, issue.id, {
    revision: current.revision,
    ...patch,
  });
}

/** An issue of alice's that an agent works on, blocked by it after asking a question. */
async function blockedIssue(nameText?: {
  key: string;
  ns: string;
}): Promise<{ issue: Issue; agentId: string }> {
  await letAgentsBlock();
  const agentId = await h.createAgent();
  // As a built-in agent is seeded.
  if (nameText)
    await h.database
      .connection()
      .repository('agAgents')
      .updateMany({ filter: { id: agentId }, values: { nameText } });
  const issue = await h.projects.issues.create(alice(), { title: 'Migrate' });
  await update(issue, { executor: { type: 'agent', id: agentId } });
  const payload = await h.claimOne();
  const token = payload.cli.credential.content.token as string;
  const asked = await h.request(
    'POST',
    `/projects/issues/${issue.identifier}/comments`,
    {
      runToken: token,
      body: { content: 'Which database should the migration target?' },
    },
  );
  expect(asked.status).toBe(201);
  const moved = await h.request(
    'PATCH',
    `/projects/issues/${issue.identifier}`,
    { runToken: token, body: { statusKey: 'blocked' } },
  );
  expect(moved.status).toBe(200);
  return { issue, agentId };
}

const blockedCleared = (issueId: string) =>
  h.port.cleared.filter(
    (ref) => ref.subject.id === issueId && ref.types?.includes(AGENT_BLOCKED),
  );

describe('an agent that reports itself blocked', () => {
  it("asks the issue's owner, with the agent's question", async () => {
    const { issue, agentId } = await blockedIssue();
    await expect
      .poll(() => planned.filter((notice) => notice.type === AGENT_BLOCKED))
      .toHaveLength(1);
    expect(
      planned.find((notice) => notice.type === AGENT_BLOCKED),
    ).toMatchObject({
      kind: 'decision',
      userIds: ['alice'],
      issue: { id: issue.id },
      actor: { type: 'agent', id: agentId, name: 'Coder' },
      params: {
        identifier: issue.identifier,
        agentId,
        from: 'todo',
        question: 'Which database should the migration target?',
      },
    });
    // The decision beats the status change for the owner.
    expect(
      planned.some(
        (notice) =>
          notice.type === 'status_changed' &&
          (notice.userIds as string[]).includes('alice'),
      ),
    ).toBe(false);
  });

  it("carries a built-in agent's name key, so the card words it in the reader's language", async () => {
    const { agentId } = await blockedIssue({
      key: 'studioAgents.presets.coder.name',
      ns: 'studio',
    });
    await expect
      .poll(() => planned.filter((notice) => notice.type === AGENT_BLOCKED))
      .toHaveLength(1);
    expect(
      planned.find((notice) => notice.type === AGENT_BLOCKED),
    ).toMatchObject({
      params: {
        agentId,
        actorName: 'Coder',
        agentNameKey: 'studioAgents.presets.coder.name',
        agentNameNs: 'studio',
      },
    });
  });

  it('settles for whoever answers it with a comment, but not for a note', async () => {
    const { issue } = await blockedIssue();
    await h.projects.comments.create(alice(), issue.id, {
      content: '/note thinking',
    });
    await h.projects.comments.create(alice(), issue.id, {
      content: 'Postgres.',
    });
    await expect.poll(() => blockedCleared(issue.id)).toHaveLength(1);
    expect(blockedCleared(issue.id)[0]).toMatchObject({
      source: 'projects',
      subject: { type: 'issue', id: issue.id },
      userIds: ['alice'],
      outcome: 'answered',
    });
  });

  it('settles once the issue is unblocked or given to someone else', async () => {
    const { issue } = await blockedIssue();
    await update(issue, { statusKey: 'todo' });
    await expect
      .poll(() => blockedCleared(issue.id).map((ref) => ref.outcome))
      .toEqual(['unblocked']);
    await update(issue, { executor: { type: 'user', id: 'bob' } });
    await expect
      .poll(() => blockedCleared(issue.id).map((ref) => ref.outcome))
      .toEqual(['unblocked', 'reassigned']);
  });

  it('asks nothing when a person moves the issue to Blocked', async () => {
    const issue = await h.projects.issues.create(alice(), { title: 'Wait' });
    await update(issue, { statusKey: 'blocked' }, alice());
    await h.projects.comments.create(bob(), issue.id, { content: 'Hm.' });
    expect(planned.some((notice) => notice.type === AGENT_BLOCKED)).toBe(false);
  });
});

describe("a failed run's card", () => {
  const failedCleared = (issueId: string) =>
    h.port.cleared.filter(
      (ref) =>
        ref.subject.id === issueId && ref.types?.includes(RUN_FAILED_FINAL),
    );

  it('folds away once the issue moves to review or finishes, not before', async () => {
    const issue = await h.projects.issues.create(alice(), { title: 'Ship' });
    await update(issue, { statusKey: 'in_progress' });
    await update(issue, { statusKey: 'in_review' });
    await expect
      .poll(() => failedCleared(issue.id).map((ref) => ref.outcome))
      .toEqual(['issueMoved']);
    const other = await h.projects.issues.create(alice(), { title: 'Drop' });
    await update(other, { statusKey: 'in_progress' });
    await update(other, { statusKey: 'cancelled' });
    await expect.poll(() => failedCleared(other.id)).toHaveLength(1);
    expect(failedCleared(issue.id)).toHaveLength(1);
  });
});
