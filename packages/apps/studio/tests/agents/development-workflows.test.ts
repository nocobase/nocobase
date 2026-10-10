// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  AI_REVIEW_TEMPLATE,
  SOFTWARE_TEMPLATE,
} from '../../server/agents/catalog/workflow-templates.js';
import { createDesignService } from '../../server/agents/design.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';
import { makeRoot, runRoleAgentsSeed } from './role-agents.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  await makeRoot(h, 'alice');
  await runRoleAgentsSeed(h);
  h.roles.set('alice', 'admin');
});
afterEach(() => h.close());

describe('development workflows', () => {
  it('keeps a direct-development executor running alone when it enters development', async () => {
    const agentId = await h.createAgent();
    const viewer = h.viewer('alice');
    const issue = await h.projects.issues.create(viewer, {
      title: 'Direct implementation',
      executor: { type: 'agent', id: agentId },
    });
    const runsOf = () =>
      h.agents.runs.list({ subjectKind: 'issue', subjectId: issue.id });
    await expect
      .poll(async () => (await runsOf()).map((run) => run.agentId))
      .toEqual([agentId]);
    await h.projects.issues.update(
      { ...viewer, actor: { type: 'agent', id: agentId } },
      issue.id,
      { revision: issue.revision, statusKey: 'in_progress' },
    );
    expect((await runsOf()).map((run) => run.agentId)).toEqual([agentId]);
    expect(
      (await h.projects.issueQueries.detail(viewer, issue.id)).executor,
    ).toEqual({ type: 'agent', id: agentId });
  });

  it('wakes the executor assigned during review when development starts', async () => {
    const viewer = h.viewer('alice');
    const agentId = await h.createAgent();
    const issue = await h.projects.issues.create(viewer, {
      title: 'Recommended developer',
      statusKey: 'proposal_review',
      start: false,
    });
    const runsOf = () =>
      h.agents.runs.list({ subjectKind: 'issue', subjectId: issue.id });
    await expect
      .poll(async () => (await runsOf()).map((run) => run.agentId))
      .toEqual(['studio-proposal-reviewer']);
    await h.projects.issues.update(viewer, issue.id, {
      revision: issue.revision,
      executor: { type: 'agent', id: agentId },
    });
    expect((await runsOf()).map((run) => run.agentId)).toEqual([
      'studio-proposal-reviewer',
    ]);
    const assigned = await h.projects.issueQueries.detail(viewer, issue.id);
    await h.projects.issues.update(viewer, issue.id, {
      revision: assigned.revision,
      statusKey: 'in_progress',
    });
    await expect
      .poll(async () => (await runsOf()).map((run) => run.agentId).sort())
      .toEqual([agentId, 'studio-proposal-reviewer'].sort());
  });

  it('assigns and wakes the senior developer only when development has no executor', async () => {
    const viewer = h.viewer('alice');
    const issue = await h.projects.issues.create(viewer, {
      title: 'Default developer',
      start: false,
    });
    await h.projects.issues.update(viewer, issue.id, {
      revision: issue.revision,
      statusKey: 'in_progress',
    });
    expect(
      (await h.projects.issueQueries.detail(viewer, issue.id)).executor,
    ).toEqual({ type: 'agent', id: 'studio-senior-developer' });
    await expect
      .poll(async () =>
        (
          await h.agents.runs.list({
            subjectKind: 'issue',
            subjectId: issue.id,
          })
        ).map((run) => run.agentId),
      )
      .toEqual(['studio-senior-developer']);
  });

  it('preserves a human executor when development starts', async () => {
    const viewer = h.viewer('alice');
    const issue = await h.projects.issues.create(viewer, {
      title: 'Human implementation',
      executor: { type: 'user', id: 'alice' },
      start: false,
    });
    await h.projects.issues.update(viewer, issue.id, {
      revision: issue.revision,
      statusKey: 'in_progress',
    });
    expect(
      (await h.projects.issueQueries.detail(viewer, issue.id)).executor,
    ).toEqual({ type: 'user', id: 'alice' });
    expect(
      await h.agents.runs.list({ subjectKind: 'issue', subjectId: issue.id }),
    ).toEqual([]);
  });

  it('validates both templates and uses agent review for a new project by default', async () => {
    await h.projects.workflows.installTemplate(AI_REVIEW_TEMPLATE);
    await h.projects.workflows.installTemplate(SOFTWARE_TEMPLATE);
    const workflows = await h.projects.workflows.list(h.viewer('alice'));
    expect(
      workflows
        .filter((workflow) => workflow.isDefault)
        .map((workflow) => workflow.builtInKey),
    ).toEqual(['aiReviewedDevelopment']);
    const project = await h.projects.projects.create(h.viewer('alice'), {
      name: 'New project',
    });
    const catalog = await h.projects.workflows.catalogs.forProject(
      h.database.connection(),
      project.id,
    );
    expect(catalog.machine.definition).toEqual(
      JSON.parse(JSON.stringify(AI_REVIEW_TEMPLATE.definition)),
    );
  });

  it('keeps the owner approval gate and makes code review optional', async () => {
    await h.projects.workflows.installTemplate(SOFTWARE_TEMPLATE);
    const owner = (await h.projects.workflows.list(h.viewer('alice'))).find(
      (workflow) => workflow.builtInKey === 'software',
    )!;
    await h.projects.workflows.setDefault(h.viewer('alice'), owner.id);
    const issue = await h.projects.issues.create(h.viewer('alice'), {
      title: 'Owner decides',
      start: false,
    });
    await h.projects.issues.update(h.viewer('alice'), issue.id, {
      revision: issue.revision,
      statusKey: 'proposal_review',
    });
    const current = await h.projects.issueQueries.detail(
      h.viewer('alice'),
      issue.id,
    );
    await expect(
      h.projects.issues.update(
        { ...h.viewer('alice'), actor: { type: 'agent', id: 'reviewer' } },
        issue.id,
        { revision: current.revision, statusKey: 'in_progress' },
      ),
    ).rejects.toMatchObject({ code: 'TRANSITION_NOT_ALLOWED' });
    expect(
      owner.definition.states.find((state) => state.key === 'in_review')?.rules,
    ).toEqual([expect.objectContaining({ type: 'notifyOwner' })]);
    await expect
      .poll(
        () =>
          h.port.sent.filter((notice) => notice.type === 'design_review')
            .length,
      )
      .toBe(1);
  });

  it('starts agent proposal review without sending a human approval card', async () => {
    const design = createDesignService({
      projects: () => h.projects,
      inbox: () => h.port,
    });
    const stop = design.bindCards((error) => {
      throw error;
    });
    try {
      const project = await h.projects.projects.create(h.viewer('alice'), {
        name: 'Agent review',
      });
      const issue = await h.projects.issues.create(h.viewer('alice'), {
        title: 'Review proposal',
        projectId: project.id,
        start: false,
      });
      await h.projects.issues.update(h.viewer('alice'), issue.id, {
        revision: issue.revision,
        statusKey: 'proposal_review',
      });
      await expect
        .poll(async () =>
          (
            await h.agents.runs.list({
              subjectKind: 'issue',
              subjectId: issue.id,
            })
          ).map((run) => run.agentId),
        )
        .toEqual(['studio-proposal-reviewer']);
      // The listener is asynchronous; finish its reads before inspecting the inbox.
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(
        h.port.sent.filter((notice) => notice.type === 'design_review'),
      ).toEqual([]);
    } finally {
      stop();
    }
  });
});
