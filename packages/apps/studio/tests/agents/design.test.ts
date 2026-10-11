// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import { createDesignService } from '../../server/agents/design.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  await h.addUser('bob');
});
afterEach(() => h.close());
const alice = () => h.viewer('alice');
const service = () =>
  createDesignService({
    projects: () => h.projects,
    agents: h.agents,
    kinds: h.projects.kinds,
    inbox: () => undefined,
  });
async function proposal(
  executor?: { type: 'agent' | 'user'; id: string },
  projectId?: string,
) {
  const issue = await h.projects.issues.create(alice(), {
    title: 'Build a feature',
    projectId,
    executor,
    start: false,
  });
  await h.projects.comments.post(
    alice().actor,
    issue.id,
    { content: '# Plan\n\n## Recommended executor\nSenior developer' },
    { kind: 'proposal', trigger: false },
  );
  await h.projects.issues.update(alice(), issue.id, {
    revision: issue.revision,
    statusKey: 'proposal_review',
    start: false,
  });
  return issue;
}

describe('design approval executor eligibility', () => {
  it('requires a developer and leaves status intact, then approves once with an eligible executor', async () => {
    const designer = await h.createAgent({
      name: 'Designer',
      actions: ['pm.issues/view'],
    });
    const coder = await h.createAgent({ name: 'Senior developer' });
    const issue = await proposal({ type: 'agent', id: designer });
    const state = await service().state(alice(), issue.id);
    expect(state.executorOk).toBe(false);
    expect(state.recommendedAgentId).toBe(coder);
    expect(state.executorCandidates.map((item) => item.id)).not.toContain(
      designer,
    );
    await expect(
      service().approve(alice(), issue.id, {}),
    ).rejects.toMatchObject({ details: { code: 'DESIGN_EXECUTOR_REQUIRED' } });
    expect(
      (await h.projects.issueQueries.detail(alice(), issue.id)).statusKey,
    ).toBe('proposal_review');
    await expect(
      service().approve(alice(), issue.id, {
        executor: { type: 'agent', id: designer },
      }),
    ).rejects.toMatchObject({ details: { code: 'DESIGN_EXECUTOR_INVALID' } });
    await service().approve(alice(), issue.id, {
      executor: { type: 'agent', id: coder },
      comment: 'Approved',
    });
    expect(
      await h.projects.issueQueries.detail(alice(), issue.id),
    ).toMatchObject({
      statusKey: 'in_progress',
      executor: { type: 'agent', id: coder },
    });
    const runs = await h.agents.runs.list({
      subjectKind: 'issue',
      subjectId: issue.id,
    });
    expect(runs).toHaveLength(1);
    expect(runs[0]!.agentId).toBe(coder);
    // Assignment and the default workflow's development instruction merge into one run.
    const inputs = (await h.agents.runs.detail(runs[0]!.id)).inputs;
    expect(inputs).toHaveLength(2);
    expect(inputs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          payload: expect.objectContaining({
            trigger: 'stageEntered',
            to: 'in_progress',
          }),
        }),
      ]),
    );
  });

  it('keeps a valid existing executor and refuses a person without approval rights', async () => {
    const coder = await h.createAgent();
    const issue = await proposal({ type: 'agent', id: coder });
    expect((await service().state(alice(), issue.id)).executorOk).toBe(true);
    await expect(
      service().approve(h.viewer('bob'), issue.id, {}),
    ).rejects.toMatchObject({ details: { code: 'DESIGN_APPROVE_FORBIDDEN' } });
    expect((await service().approve(alice(), issue.id, {})).statusKey).toBe(
      'in_progress',
    );
  });

  it('does not offer private developers or default an ambiguous recommendation', async () => {
    const privateId = await h.createAgent({
      name: 'Senior developer',
      access: 'ownerOnly',
      ownerUserId: 'bob',
    });
    const issue = await proposal();
    const state = await service().state(alice(), issue.id);
    expect(state.executorCandidates.map((item) => item.id)).not.toContain(
      privateId,
    );
    expect(state.recommendedAgentId).toBeNull();
  });
  it('offers project members and approves a person without starting an agent', async () => {
    const project = await h.projects.projects.create(alice(), {
      name: 'A project',
      leadUserId: 'alice',
    });
    await h.projects.projects.addMember(alice(), project.id, { userId: 'bob' });
    const issue = await proposal(undefined, project.id);
    expect(
      (await service().state(alice(), issue.id)).executorCandidates,
    ).toContainEqual({ type: 'user', id: 'bob', name: 'bob' });
    await service().approve(alice(), issue.id, {
      executor: { type: 'user', id: 'bob' },
    });
    expect(
      (await h.projects.issueQueries.detail(alice(), issue.id)).executor,
    ).toEqual({ type: 'user', id: 'bob' });
    expect(
      await h.agents.runs.list({ subjectKind: 'issue', subjectId: issue.id }),
    ).toEqual([]);
  });

  it('shows the proposal and offers agents to an owner who may not see the project', async () => {
    const coder = await h.createAgent();
    const project = await h.projects.projects.create(alice(), {
      name: 'A project',
      leadUserId: 'alice',
    });
    await h.projects.projects.addMember(alice(), project.id, { userId: 'bob' });
    const issue = await proposal(undefined, project.id);
    const viewer = alice();
    const noProject = {
      ...viewer,
      permissions: {
        ...viewer.permissions,
        scopes: { ...viewer.permissions.scopes, 'pm.projects/view': 'none' },
      },
    } as typeof viewer;
    await expect(
      h.projects.projects.get(noProject, project.id),
    ).rejects.toBeTruthy();
    const state = await service().state(noProject, issue.id);
    expect(state.canApprove).toBe(true);
    expect(state.executorCandidates).toEqual([
      { type: 'agent', id: coder, name: 'Coder' },
    ]);
    await expect(
      service().approve(noProject, issue.id, {
        executor: { type: 'user', id: 'bob' },
      }),
    ).rejects.toMatchObject({ details: { code: 'DESIGN_EXECUTOR_INVALID' } });
    await service().approve(noProject, issue.id, {
      executor: { type: 'agent', id: coder },
    });
    expect(
      (await h.projects.issueQueries.detail(alice(), issue.id)).statusKey,
    ).toBe('in_progress');
  });
});

it('does not let an approver choose a developer the issue owner cannot invoke', async () => {
  h.roles.set('bob', 'admin');
  const privateDeveloper = await h.createAgent({
    access: 'ownerOnly',
    ownerUserId: 'bob',
  });
  const issue = await proposal();
  const state = await service().state(h.viewer('bob'), issue.id);
  expect(
    state.executorCandidates.map((candidate) => candidate.id),
  ).not.toContain(privateDeveloper);
  await expect(
    service().approve(h.viewer('bob'), issue.id, {
      executor: { type: 'agent', id: privateDeveloper },
    }),
  ).rejects.toMatchObject({ details: { code: 'DESIGN_EXECUTOR_INVALID' } });
});
