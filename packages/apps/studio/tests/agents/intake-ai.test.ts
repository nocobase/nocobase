// @vitest-environment node
/**
 * Requirement intake with AI in Studio: a request is one run of the person's online agent on the private `intake`
 * subject, which reads the task in its brief and hands the drafts back with `nb-studio intake drafts`; the drafts become
 * the person's pending draft, and the run may do nothing else. A run that ends without drafts fails the request.
 */
import { RUNNER_ROUTES } from '@nocobase/agent-protocol';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createBridgeHarness, type BridgeHarness } from './bridge-harness.js';

let h: BridgeHarness;
beforeEach(async () => {
  h = await createBridgeHarness();
  for (const id of ['alice', 'bob']) await h.addUser(id);
});
afterEach(() => h.close());

const alice = () => h.viewer('alice');

/** An online agent everyone may wake, with more actions than an intake run keeps, set as the team's default. */
async function defaultAgent(): Promise<string> {
  const agentId = await h.createAgent({
    name: 'Planner',
    actions: [
      'pm.projects/view',
      'pm.issues/view',
      'pm.issues/create',
      'pm.issues/edit',
      'pm.issues/comment',
    ],
  });
  await h.agents.chat.updateSettings('admin', { defaultAgentId: agentId });
  return agentId;
}

describe('intake with AI as an agent run', () => {
  it('passes structured wait parameters to intake progress', async () => {
    await defaultAgent();
    const job = await h.projects.intakeAi.start(alice(), {
      mode: 'split',
      text: 'Ship it',
    });
    const workload = await h.agents.runs.workload({ subjectKind: 'intake' });
    vi.spyOn(h.agents.runs, 'workload').mockResolvedValue({
      ...workload,
      runs: workload.runs.map((run) => ({
        ...run,
        wait: {
          ...run.wait!,
          reason: 'secretsNotAllowed',
          params: { variables: ['NPM_TOKEN'] },
        },
      })),
    });
    expect(
      (await h.projects.intakeAi.get(alice(), job.id)).progress,
    ).toMatchObject({
      phase: 'queued',
      waitReason: 'secretsNotAllowed',
      waitParams: { variables: ['NPM_TOKEN'] },
    });
  });
  it('is not available until there is an agent to ask', async () => {
    expect(await h.projects.intakeAi.availability(alice())).toMatchObject({
      available: false,
      reason: 'noAgent',
    });
    await defaultAgent();
    // No runner is online yet: a request would wait for one.
    expect(await h.projects.intakeAi.availability(alice())).toEqual({
      available: true,
      reason: null,
      by: 'Planner',
      waits: true,
    });
  });

  it('runs the agent on the request, briefs it with the task, and takes the drafts it hands back', async () => {
    const agentId = await defaultAgent();
    const job = await h.projects.intakeAi.start(alice(), {
      mode: 'split',
      text: '# 登录改版\n- 表单校验\n- 限制尝试次数',
    });
    expect(job).toMatchObject({
      status: 'running',
      progress: { phase: 'queued', by: 'Planner' },
    });
    const [run] = await h.agents.runs.list({ subjectKind: 'intake' });
    expect(run).toMatchObject({
      agentId,
      actorUserId: 'alice',
      subject: { kind: 'intake', id: job.id },
      status: 'queued',
    });

    const payload = await h.claimOne();
    expect(payload.subject).toMatchObject({
      key: `intake-${job.id}`,
      title: 'Draft issues',
      url: `/issues/new?tab=ai&job=${job.id}`,
    });
    const brief = payload.prompt.system as string;
    expect(brief).toContain('You only propose issue drafts');
    expect(brief).toContain('nb-studio intake drafts --file <path>');
    expect(brief).toContain('Split the requirement material below');
    expect(brief).toContain(
      '<text>\n# 登录改版\n- 表单校验\n- 限制尝试次数\n</text>',
    );
    const token = payload.cli.credential.content.token as string;

    // The run reads, and hands drafts back; it cannot create, change or comment.
    const manifest = {
      status: 200,
      body: { data: await h.manifest({ runToken: token }) },
    };
    const ids = (manifest.body.data.commands as { id: string }[]).map(
      (command) => command.id,
    );
    expect(ids).toContain('intake:drafts');
    expect(ids).toContain('issue:search');
    expect(ids).not.toContain('issue:create');
    expect(ids).not.toContain('issue:comment:add');
    expect(ids).not.toContain('issue:update');

    const refused = await h.request('POST', '/intakeDrafts', {
      runToken: token,
      body: { drafts: [{ position: 1, parentPosition: null, title: 7 }] },
    });
    expect(refused.status).toBe(400);
    expect(refused.body.error.message).toContain('drafts[0]: title');

    const handed = await h.request('POST', '/intakeDrafts', {
      runToken: token,
      body: {
        drafts: [
          { position: 1, parentPosition: null, title: '登录改版' },
          { position: 2, parentPosition: 1, title: '表单校验', stage: 1 },
          { position: 3, parentPosition: 1, title: '限制尝试次数', stage: 2 },
        ],
      },
    });
    expect(handed.status).toBe(200);
    expect(handed.body.data).toMatchObject({ jobId: job.id, drafts: 3 });
    const done = await h.projects.intakeAi.get(alice(), job.id);
    expect(done).toMatchObject({ status: 'done' });
    const plan = await h.projects.plans.get(alice(), done.planId ?? '');
    expect(plan).toMatchObject({
      status: 'pending',
      deciderUserId: 'alice',
      proposer: { agentId, runId: payload.run.id },
      createdBy: { type: 'agent', id: agentId },
    });
    expect(plan.rows).toHaveLength(3);
    // Nothing exists until alice creates the issues.
    expect((await h.projects.issueQueries.page(alice(), {})).data).toEqual([]);
  });

  it('does not offer the command to any other run', async () => {
    const agentId = await defaultAgent();
    const conversation = await h.agents.conversations.create('alice', {
      agentId,
    });
    await h.agents.conversations.send('alice', conversation.id, {
      content: 'Hi',
    });
    const payload = await h.claimOne();
    const manifest = {
      status: 200,
      body: {
        data: await h.manifest({
          runToken: payload.cli.credential.content.token as string,
        }),
      },
    };
    expect(
      (manifest.body.data.commands as { id: string }[]).map(
        (command) => command.id,
      ),
    ).not.toContain('intake:drafts');
    // Nor does the route serve it, or a person.
    const refused = await h.request('POST', '/intakeDrafts', {
      runToken: payload.cli.credential.content.token as string,
      body: { drafts: [{ position: 1, parentPosition: null, title: 'X' }] },
    });
    expect(refused.status).toBe(403);
    const person = await h.request('POST', '/intakeDrafts', {
      user: 'alice',
      body: { drafts: [{ position: 1, parentPosition: null, title: 'X' }] },
    });
    expect(person.status).toBe(403);
  });

  it('fails the request when the run ends without drafts, and cancels the run with the request', async () => {
    await defaultAgent();
    const first = await h.projects.intakeAi.start(alice(), {
      mode: 'split',
      text: 'Ship it',
    });
    const payload = await h.claimOne();
    const failed = await h.runner(RUNNER_ROUTES.fail, payload.run.id, {
      reason: 'toolAuth',
      detail: 'Not signed in.',
    });
    expect(failed.status).toBe(200);
    await expect
      .poll(
        async () => (await h.projects.intakeAi.get(alice(), first.id)).status,
      )
      .toBe('failed');
    expect(
      (await h.projects.intakeAi.get(alice(), first.id)).error,
    ).toMatchObject({ code: 'runFailed' });

    const second = await h.projects.intakeAi.start(alice(), {
      mode: 'split',
      text: 'Ship it again',
    });
    expect(await h.projects.intakeAi.cancel(alice(), second.id)).toMatchObject({
      status: 'cancelled',
    });
    const [run] = (await h.agents.runs.list({ subjectKind: 'intake' })).filter(
      (item) => item.subject.id === second.id,
    );
    expect(run?.status).toBe('cancelled');
  });

  it('breaks an issue down with the issue and its sub-issues in the brief', async () => {
    await defaultAgent();
    const issue = await h.projects.issues.create(alice(), {
      title: '结账',
      description: '支持银行卡和发票',
    });
    await h.projects.issues.create(alice(), {
      title: '银行卡',
      parentIssueId: issue.id,
    });
    const job = await h.projects.intakeAi.start(alice(), {
      mode: 'breakdown',
      issueId: issue.identifier,
    });
    const payload = await h.claimOne();
    const brief = payload.prompt.system as string;
    expect(payload.subject.title).toBe(`Break down ${issue.identifier}`);
    expect(brief).toContain(`Break issue ${issue.identifier} down`);
    expect(brief).toContain('支持银行卡和发票');
    expect(brief).toContain('- 银行卡');
    const handed = await h.request('POST', '/intakeDrafts', {
      runToken: payload.cli.credential.content.token as string,
      body: {
        drafts: [{ position: 1, parentPosition: null, title: '发票' }],
      },
    });
    expect(handed.status).toBe(200);
    const done = await h.projects.intakeAi.get(alice(), job.id);
    const plan = await h.projects.plans.get(alice(), done.planId ?? '');
    expect(plan.rows[0]?.params).toMatchObject({
      title: '发票',
      parentIssueId: issue.id,
    });
  });
});
