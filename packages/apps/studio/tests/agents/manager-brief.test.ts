// @vitest-environment node
/**
 * What a runner is handed for a run on an issue, over the real plugins: the project manager's run (its role and the
 * allocation principles in force, the roster of agents it may hand work to, no checkout, a work directory of its own),
 * and an agent's step (the project's working directories, the built-in worker instructions, no status moves), read-only
 * when its hand-over says so.
 */
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  BUILT_IN_PRINCIPLES,
  MANAGER_ROLE,
  WORKER_INSTRUCTIONS,
} from '../../server/agents/manager/texts.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
let projectId: string;
beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  h.roles.set('alice', 'admin');
  projectId = (
    await h.projects.projects.create(h.viewer('alice'), { name: 'Web' })
  ).id;
  await h.projects.projects.addResource(h.viewer('alice'), projectId, {
    type: 'gitRepo',
    url: 'https://example.com/acme/web.git',
    defaultRef: 'main',
  });
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');

/** An open issue of the project, given to the project manager (`start`) or to nobody. */
function openIssue(manager: boolean): Promise<Issue> {
  return h.projects.issues.create(alice(), {
    title: 'Fix login',
    projectId,
    statusKey: 'in_progress',
    executor: manager ? { type: 'agent', id: PROJECT_MANAGER_ID } : null,
  });
}

const firstLine = (text: string) => text.split('\n')[0]!;

describe("the project manager's run", () => {
  it('is briefed with its role, the built-in principles and the roster, and checks nothing out', async () => {
    const coder = await h.createAgent({ name: 'Coder' });
    const reviewer = await h.createAgent({
      name: 'Reviewer',
      description: 'Reviews code\nthoroughly.',
    });
    const disabled = await h.createAgent({ name: 'Disabled' });
    await h.database
      .connection()
      .query.updateTable('agAgents')
      .set({ status: 'disabled' })
      .where('id', '=', disabled)
      .execute();
    const issue = await openIssue(true);
    const payload = await h.claimOne();
    expect((await h.agents.runs.get(payload.run.id)).subject).toEqual({
      kind: 'issue',
      id: issue.id,
    });
    const system = payload.prompt.system as string;
    expect(system).toContain(firstLine(MANAGER_ROLE));
    expect(system).toContain('# Allocation principles');
    expect(system).toContain(firstLine(BUILT_IN_PRINCIPLES));
    expect(system).not.toContain(firstLine(WORKER_INSTRUCTIONS));
    expect(system).toContain(`Arrange issue ${issue.identifier} in comments`);

    expect(system).toContain('## Agents you can hand work to');
    expect(system).toContain(
      `- [@Coder](mention://agent/${coder}) (online, canStartNow=true,`,
    );
    expect(system).toContain(
      `- [@Reviewer](mention://agent/${reviewer}) (online, canStartNow=true,`,
    );
    expect(system).not.toContain(`mention://agent/${disabled}`);
    expect(system).not.toContain(`mention://agent/${PROJECT_MANAGER_ID}`);

    expect(payload.workspace.dirs).toEqual([]);
    expect(payload.workspace.key).toBe(`${issue.identifier}.manager`);
    expect(payload.workspace.readOnly).toBeUndefined();
  });

  it.each([false, true])(
    'counts the manager tool reservation in its real brief (retry=%s)',
    async (retry) => {
      const worker = await h.createAgent({
        name: 'Worker',
        tool: retry ? 'codex' : 'claude',
      });
      await h.claimOne();
      await h.database
        .connection()
        .query.updateTable('agRunners')
        .set({ toolSlots: { claude: 1, codex: 1 } })
        .allowAllRows()
        .execute();
      if (retry) {
        const preferred = await h.createAgent({
          name: 'Initial choice',
          tool: 'claude',
          model: 'initial',
        });
        await h.manager.update('alice', { firstChoiceAgentId: preferred });
      }
      await openIssue(true);
      let payload = await h.claimOne();
      if (retry) {
        const oldTool = (await h.agents.runs.get(payload.run.id)).tool;
        expect(oldTool).toBe('claude');
        await h.database
          .connection()
          .query.updateTable('agRuns')
          .set({
            maxAttempts: 3,
            leaseExpiresAt: new Date(Date.now() - 1_000).toISOString(),
          })
          .where('id', '=', payload.run.id)
          .execute();
        await h.agents.sweeper.sweep();
        await h.manager.update('alice', { firstChoiceAgentId: worker });
        await h.database
          .connection()
          .query.updateTable('agRuns')
          .set({ availableAt: null })
          .where('id', '=', payload.run.id)
          .execute();
        payload = await h.claimOne();
      }
      expect(payload.prompt.system).toContain(
        `- [@Worker](mention://agent/${worker}) (online, canStartNow=false,`,
      );
      expect(payload.prompt.system).toContain(`${retry ? 'codex' : 'claude'}/`);
      expect((await h.agents.runs.get(payload.run.id)).tool).toBe(
        retry ? 'codex' : 'claude',
      );
    },
  );

  it.each([
    ['in_progress', ['blocked', 'in_review']],
    ['blocked', ['in_progress', 'in_review']],
    ['in_review', ['in_progress', 'blocked']],
  ] as const)(
    'briefs the real next transitions from %s',
    async (statusKey, moves) => {
      await h.createAgent({ name: 'Coder' });
      const issue = await openIssue(true);
      if (statusKey !== 'in_progress') {
        await h.projects.issues.update(alice(), issue.id, {
          revision: issue.revision,
          statusKey,
        });
      }
      const payload = await h.claimOne();
      const system = payload.prompt.system as string;
      expect(system).toContain(
        `At this read, the current status is ${statusKey}; available next transitions are: ${moves.join(', ')}`,
      );
      expect(system).toContain(
        'not a fixed restriction after the status changes',
      );
      expect(system).toContain(`nb-studio issue get ${issue.identifier}`);
      expect(system).toContain('never bypass a refusal');
    },
  );

  it('leaves out of the roster an agent no runner reported for 14 days', async () => {
    await h.createAgent({ name: 'Coder' });
    // The runner registers first: its report would refresh every agent it has.
    expect(await h.claimOne()).toBeUndefined();
    const stale = await h.createAgent({ name: 'Stale' });
    await h.database
      .connection()
      .repository('agAgents')
      .updateMany({
        filter: { id: stale },
        values: {
          lastReportedAt: new Date(
            Date.now() - 15 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
      });
    await openIssue(true);
    const payload = await h.claimOne();
    const system = payload.prompt.system as string;
    expect(system).toContain('## Agents you can hand work to');
    expect(system).toContain('[@Coder]');
    expect(system).not.toContain(`mention://agent/${stale}`);
  });

  it('tells it to block the issue when no agent is enabled to hand work to', async () => {
    const only = await h.createAgent({ name: 'Coder' });
    await openIssue(true);
    // Disabled after the project manager took its tool and model.
    await h.database
      .connection()
      .query.updateTable('agAgents')
      .set({ status: 'disabled' })
      .where('id', '=', only)
      .execute();
    const payload = await h.claimOne();
    expect(payload.prompt.system).toContain(
      'No agent is enabled for this person now. Move the issue to `blocked`',
    );
  });

  it('runs with the principles an administrator wrote, and the built-in ones again once restored', async () => {
    await h.createAgent({ name: 'Coder' });
    const own =
      '## Who does what\n\nEvery change goes to Coder, then to a review.';
    const saved = await h.manager.update('alice', { principles: own });
    expect(saved.principles).toBe(own);
    expect((await h.agents.agents.get(PROJECT_MANAGER_ID)).instructions).toBe(
      `${MANAGER_ROLE}\n\n# Allocation principles\n\n${own}`,
    );
    await openIssue(true);
    const payload = await h.claimOne();
    expect(payload.prompt.system).toContain(
      'Every change goes to Coder, then to a review.',
    );
    expect(payload.prompt.system).not.toContain(
      'Pick an agent by what its description says it is good at:',
    );

    // The built-in text saved as it is counts as the built-in principles.
    const restored = await h.manager.update('alice', {
      principles: BUILT_IN_PRINCIPLES,
    });
    expect(restored.principles).toBeNull();
    expect((await h.agents.agents.get(PROJECT_MANAGER_ID)).instructions).toBe(
      `${MANAGER_ROLE}\n\n# Allocation principles\n\n${BUILT_IN_PRINCIPLES}`,
    );
  });
});

describe("an agent's step", () => {
  async function handOver(content: (mention: string) => string) {
    const coder = await h.createAgent({ name: 'Coder' });
    // What every agent discovered from runners is given (the harness's agents start with their own).
    await h.agents.agents.applyDefaults();
    expect((await h.agents.agents.get(coder)).instructions).toBe(
      WORKER_INSTRUCTIONS,
    );
    const issue = await openIssue(false);
    await h.projects.comments.create(alice(), issue.id, {
      content: content(`[@Coder](mention://agent/${coder})`),
    });
    return { coder, issue, payload: await h.claimOne() };
  }

  it("works in the project's working directories, with the worker instructions, and moves no status", async () => {
    const { coder, issue, payload } = await handOver(
      (mention) => `${mention} fix the sign-in`,
    );
    expect((await h.agents.runs.get(payload.run.id)).subject).toEqual({
      kind: 'issue',
      id: issue.id,
    });
    expect((await h.agents.runs.get(payload.run.id)).agentId).toBe(coder);
    expect(payload.workspace.dirs).toEqual([
      expect.objectContaining({
        kind: 'repo',
        url: 'https://example.com/acme/web.git',
        branch: `agent/${issue.identifier}`,
      }),
    ]);
    expect(payload.workspace.key).not.toBe(`${issue.identifier}.manager`);
    expect(payload.workspace.readOnly).toBeUndefined();
    const system = payload.prompt.system as string;
    expect(system).toContain(firstLine(WORKER_INSTRUCTIONS));
    expect(WORKER_INSTRUCTIONS).toContain(
      'git push origin HEAD:refs/heads/<branch>',
    );
    expect(system).toContain('private runner alias');
    expect(WORKER_INSTRUCTIONS).toContain(
      'never rewrite history already pushed',
    );
    expect(WORKER_INSTRUCTIONS).toContain('switch or create branches');
    expect(WORKER_INSTRUCTIONS).toContain('push any branch of this repository');
    expect(WORKER_INSTRUCTIONS).toContain('nb-studio pr open --head <branch>');
    expect(WORKER_INSTRUCTIONS).toContain('nb-studio pr unlink');
    expect(system).toContain("Do not change the issue's status.");
    expect(system).not.toContain(firstLine(MANAGER_ROLE));
    expect(system).not.toContain('## Agents you can hand work to');
    expect(system).not.toContain('available next transitions');

    const token = payload.cli.credential.content.token as string;
    const moved = await h.request(
      'PATCH',
      `/projects/issues/${issue.identifier}`,
      { runToken: token, body: { statusKey: 'in_review' } },
    );
    expect(moved.status).toBe(400);
    expect(moved.body.error.reason).toBe('TRANSITION_NOT_ALLOWED');
  });

  it('gets a read-only checkout when its hand-over says `Mode: read-only`', async () => {
    const { payload } = await handOver(
      (mention) => `${mention} review the pull request.\n\nMode: read-only`,
    );
    expect(payload.workspace.readOnly).toBe(true);
    expect(payload.workspace.dirs).toHaveLength(1);
  });
});
