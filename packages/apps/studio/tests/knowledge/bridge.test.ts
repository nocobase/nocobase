// @vitest-environment node
/**
 * The knowledge base joined to the agents and projects plugins as Studio joins it: what a run on an issue is told and
 * given, the `nb-studio kb` routes (`/api/kb`) within the agent's actions and the person who woke it, proposals from changed files,
 * the inbox cards, and the retrospective rule.
 */
import { MountBundleSchema } from '@nocobase/agent-protocol';
import type { Issue } from '@nocobase/app-plugin-projects/shared/issues';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RUN_LAYOUT } from '../../server/knowledge/mount.js';
import { makeRoot, runRoleAgentsSeed } from '../agents/role-agents.js';

import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';

let h: BridgeHarness;
let projectId: string;
let agentId: string;
beforeEach(async () => {
  h = await createBridgeHarness({ knowledge: true });
  for (const id of ['alice', 'bob', 'root']) await h.addUser(id);
  h.roles.set('root', 'admin');
  // Alice leads the project; Bob is a member who works with the agent.
  const project = await h.projects.projects.create(h.viewer('root'), {
    name: 'Studio',
    leadUserId: 'alice',
  });
  projectId = project.id;
  await h.projects.projects.addMember(h.viewer('root'), projectId, {
    userId: 'bob',
  });
  const docs = h.knowledge!.docs;
  await docs.create(
    { userId: 'root' },
    {
      scope: 'system',
      scopeId: '',
      title: 'Team conventions',
      slug: 'conventions',
      summary: 'How we work.',
      content: '# Conventions\n\nSmall commits.',
    },
  );
  await docs.create(
    { userId: 'root' },
    {
      scope: 'system',
      scopeId: '',
      title: 'User manual',
      slug: 'manual',
      content: '# User manual\n\n最后核对：2026-10-01',
    },
  );
  const pitfalls = await docs.create(
    { userId: 'alice' },
    {
      scope: 'project',
      scopeId: projectId,
      title: 'Known pitfalls',
      slug: 'known-pitfalls',
      content: '# Known pitfalls',
    },
  );
  await docs.create(
    { userId: 'alice' },
    {
      scope: 'project',
      scopeId: projectId,
      parentId: pitfalls.id,
      title: 'SQLite locks',
      slug: 'sqlite-locks',
      content: '# SQLite locks\n\nOne connection.',
    },
  );
  agentId = await h.createAgent({
    actions: [
      'pm.issues/view',
      'pm.issues/comment',
      'pm.issues/edit',
      'kb.knowledge/read',
      'kb.knowledge/propose',
    ],
  });
});
afterEach(() => h.close());

const kb = (path: string) => `/kb${path}`;

async function startWork(title = 'Faster lists'): Promise<Issue> {
  const issue = await h.projects.issues.create(h.viewer('bob'), {
    title,
    projectId,
  });
  const current = await h.projects.issueQueries.detail(
    h.viewer('bob'),
    issue.id,
  );
  await h.projects.issues.update(h.viewer('bob'), issue.id, {
    revision: current.revision,
    executor: { type: 'agent', id: agentId },
    statusKey: 'in_progress',
  });
  return issue;
}

const withMounts = [
  'input',
  'checkout',
  'directories',
  'skills',
  'secrets',
  'mounts',
];

describe('a run on an issue', () => {
  it('is told the knowledge index and given the files, for the person who woke it', async () => {
    await startWork();
    const payload = await h.claimOne(withMounts);
    const system = payload.prompt.system as string;
    expect(system).toContain('## Knowledge');
    expect(system).toContain(
      '- **Known pitfalls** (`known-pitfalls`, this project): (no summary) (1 below it: `nb-studio kb list --parent known-pitfalls`)',
    );
    expect(system).toContain(
      '- **Team conventions** (`conventions`, system-wide): How we work.',
    );
    expect(system).toContain('`.nocobase-runner/knowledge/`');
    // Proposing knowledge waits for the retrospective, after the work is done.
    expect(system).not.toContain('## Capture learnings');
    // The issue is in progress and the system space has the manual: the delivery line in the installation's language.
    expect(system).toContain('## User manual');
    expect(system).toContain('`手册：无影响`');
    expect(payload.mounts).toEqual([
      expect.objectContaining({
        name: 'knowledge',
        target: '.nocobase-runner/knowledge',
        bundleUrl: `/api/agents/runners/runs/${payload.run.id}/mounts/knowledge`,
      }),
    ]);
    expect(payload.run.requires).not.toContain('mounts');

    const bundle = await h.request(
      'GET',
      `/agents/runners/runs/${payload.run.id}/mounts/knowledge`,
      { headers: { 'x-nocobase-runner-key': h.runnerKey() ?? '' } },
    );
    expect(bundle.status).toBe(200);
    const files = MountBundleSchema.parse(bundle.body.data).files.map(
      (file) => file.path,
    );
    expect(files).toEqual([
      'INDEX.md',
      'project/known-pitfalls/README.md',
      'project/known-pitfalls/sqlite-locks.md',
      'system/conventions.md',
      'system/manual.md',
      '.manifest.json',
    ]);
  });

  it('does not ask an analysis run to capture learnings', async () => {
    await makeRoot(h, 'root');
    await runRoleAgentsSeed(h);
    const issue = await h.projects.issues.create(h.viewer('bob'), {
      title: 'Why are lists slow?',
      projectId,
    });
    const current = await h.projects.issueQueries.detail(
      h.viewer('bob'),
      issue.id,
    );
    await h.projects.issues.update(h.viewer('bob'), issue.id, {
      revision: current.revision,
      executor: { type: 'agent', id: agentId },
      statusKey: 'analysis',
    });
    const system = (await h.claimOne(withMounts)).prompt.system as string;
    expect(system).toContain('## Knowledge');
    expect(system).not.toContain('## Capture learnings');
    expect(system).not.toContain('## Retrospective');
  });

  it('gives an older runner no files, and the brief points at the commands instead', async () => {
    await startWork();
    const payload = await h.claimOne();
    expect(payload).not.toHaveProperty('mounts');
    expect(payload.prompt.system).toContain(
      'Read a document with `nb-studio kb read <slug>`',
    );
  });

  it('says nothing of knowledge to an agent not configured to read it', async () => {
    agentId = await h.createAgent({
      name: 'Plain',
      actions: ['pm.issues/view', 'pm.issues/comment'],
    });
    await startWork();
    const payload = await h.claimOne(withMounts);
    expect(payload.prompt.system).not.toContain('## Knowledge');
    expect(payload).not.toHaveProperty('mounts');
  });
});

describe('nb-studio kb', () => {
  it('reads and searches within the agent’s actions, and proposes the files it changed', async () => {
    await startWork();
    const payload = await h.claimOne(withMounts);
    const token = payload.cli.credential.content.token as string;
    const manifest = {
      status: 200,
      body: { data: await h.manifest({ runToken: token }) },
    };
    const ids = (manifest.body.data.commands as { id: string }[]).map(
      (command) => command.id,
    );
    expect(ids).toEqual(
      expect.arrayContaining([
        'kb:list',
        'kb:tree',
        'kb:read',
        'kb:search',
        'kb:download',
        'kb:propose',
        'kb:upload',
      ]),
    );

    const tree = await h.request('GET', kb('/tree'), { runToken: token });
    expect(tree.status).toBe(200);
    expect(tree.body.meta.message).toContain('# Project Studio');
    expect(tree.body.meta.message).toContain(
      '  - sqlite-locks  SQLite locks (v1)',
    );
    const read = await h.request('GET', kb('/docs/sqlite-locks'), {
      runToken: token,
    });
    expect(read.body.meta.message).toBe('# SQLite locks\n\nOne connection.');
    expect(read.body.data.url).toContain(read.body.data.id);
    const search = await h.request('GET', kb('/search?q=connection'), {
      runToken: token,
    });
    expect(search.body.data[0]).toMatchObject({
      slug: 'sqlite-locks',
      lines: '1-3',
    });

    // The run edits a mounted file and adds one, then proposes both.
    const bundle = await h.knowledge!.snapshots.files(
      h.database.connection(),
      payload.run.id,
      RUN_LAYOUT,
    );
    const original = bundle!.files.find(
      (file) => file.path === 'project/known-pitfalls/sqlite-locks.md',
    )!.content;
    const edited = original.replace(
      'One connection.',
      'One connection; read through the transaction.',
    );
    // As `nb-studio kb propose --changed` sends them: multipart, each file named by its path in the mount.
    const form = new FormData();
    form.append('reason', 'Learned while fixing the lists.');
    form.append(
      'files',
      new Blob([edited]),
      'project/known-pitfalls/sqlite-locks.md',
    );
    form.append(
      'files',
      new Blob(['# Release checklist\n\nTag, then deploy.']),
      'project/release-checklist.md',
    );
    const proposed = await h.request('POST', kb('/proposals'), {
      runToken: token,
      raw: form,
    });
    expect(proposed.status).toBe(200);
    expect(proposed.body.data).toEqual([
      expect.objectContaining({
        path: 'project/known-pitfalls/sqlite-locks.md',
        kind: 'update',
      }),
      expect.objectContaining({
        path: 'project/release-checklist.md',
        kind: 'create',
      }),
    ]);
    const pending = await h.knowledge!.proposals.list(
      { userId: 'alice' },
      {
        decidable: true,
      },
    );
    expect(
      pending.map((item) => [
        item.kind,
        item.title,
        item.baseVersion,
        item.source?.kind,
      ]),
    ).toEqual([
      ['create', 'Release checklist', null, 'issue'],
      ['update', null, 1, 'issue'],
    ]);
    const update = pending.find((item) => item.kind === 'update')!;
    expect(update.content).toBe(
      '# SQLite locks\n\nOne connection; read through the transaction.\n',
    );
    expect(update.proposer).toMatchObject({ kind: 'agent', id: agentId });
    expect(update.authorizedBy).toMatchObject({ id: 'bob' });

    // The lead gets the cards, issue or not; deciding settles them and tells the person it was made for.
    await new Promise((resolve) => setTimeout(resolve, 20));
    const cards = h.port.sent.filter((notice) => notice.source === 'knowledge');
    expect(cards.map((card) => [card.type, card.userIds])).toEqual([
      ['knowledge_proposal', ['alice']],
      ['knowledge_proposal', ['alice']],
    ]);
    expect(cards[0]!.data).toMatchObject({
      kind: 'update',
      title: 'SQLite locks',
      spaceTitle: 'Studio',
      reason: 'Learned while fixing the lists.',
      proposerName: 'Coder',
    });
    await h.knowledge!.proposals.accept({ userId: 'alice' }, update.id);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(h.port.settled).toContainEqual({
      decisionKey: update.id,
      outcome: 'accepted',
    });
    expect(h.port.sent.at(-1)).toMatchObject({
      type: 'knowledge_decided',
      userIds: ['bob'],
      data: { decision: 'accepted', version: 2 },
    });

    // An agent never edits: the command offered is propose, and a fourth proposal of the run is refused.
    expect(ids.filter((id) => id.startsWith('kb:doc:'))).toEqual([]);
    const verify = await h.request('POST', kb('/proposals'), {
      runToken: token,
      body: { doc: 'conventions', verify: true, reason: 'Still true.' },
    });
    expect(verify.status).toBe(201);
    expect(verify.body.data.kind).toBe('verify');
    expect(verify.body.meta.message).toContain('conventions still holds');
    const fourth = await h.request('POST', kb('/proposals'), {
      runToken: token,
      body: { doc: 'manual', verify: true, reason: 'Checked.' },
    });
    expect(fourth.status).toBe(429);
    expect(fourth.body.error.reason).toBe('KNOWLEDGE_PROPOSAL_LIMIT');
  });

  it('mounts a file as its text, downloads the original, and proposes a file through a ticket', async () => {
    const knowledge = h.knowledge!;
    const folder = await knowledge.docs.create(
      { userId: 'alice' },
      {
        scope: 'project',
        scopeId: projectId,
        kind: 'folder',
        title: 'Runbooks',
        slug: 'runbooks',
      },
    );
    const runbook = await knowledge.files.upload(
      { userId: 'alice' },
      { scope: 'project', scopeId: projectId, parentId: folder.id },
      new File(['# Queue\n\nRestart the queue worker.'], 'queue.md'),
    );
    await knowledge.files.idle();
    await startWork();
    const payload = await h.claimOne(withMounts);
    const token = payload.cli.credential.content.token as string;
    const bundle = await knowledge.snapshots.files(
      h.database.connection(),
      payload.run.id,
      RUN_LAYOUT,
    );
    const mounted = bundle!.files.find(
      (file) => file.path === 'project/runbooks/queue.md.md',
    )!.content;
    expect(mounted).toContain('kind: file\nfilename: "queue.md"');
    expect(mounted).toContain('Restart the queue worker.');
    expect(
      bundle!.files.find((file) => file.path === 'INDEX.md')!.content,
    ).toContain('the original: `nb-studio kb download queue-md`');

    const tree = await h.request('GET', kb('/tree'), { runToken: token });
    expect(tree.body.meta.message).toContain('- runbooks/  Runbooks (folder)');
    expect(tree.body.meta.message).toContain(
      '  - queue-md  queue.md (file queue.md, v1)',
    );
    const search = await h.request('GET', kb('/search?q=restart'), {
      runToken: token,
    });
    expect(search.body.data[0]).toMatchObject({
      docId: runbook.id,
      kind: 'file',
    });
    const download = await h.request('GET', kb('/docs/queue-md/file'), {
      runToken: token,
    });
    expect(download.status).toBe(200);
    expect(download.body).toBe('# Queue\n\nRestart the queue worker.');
    expect(download.headers.get('content-disposition')).toContain('queue.md');
    const notFile = await h.request('GET', kb('/docs/known-pitfalls/file'), {
      runToken: token,
    });
    expect(notFile.status).toBe(400);

    // Its text is not proposed as text: the file is replaced by a file.
    const form = new FormData();
    form.append('reason', 'Edited the text.');
    form.append(
      'files',
      new Blob([mounted.replace('Restart', 'Stop')]),
      'project/runbooks/queue.md.md',
    );
    form.append(
      'files',
      new Blob(['# Cache\n\nFlush it.']),
      'project/runbooks/cache.md',
    );
    const changed = await h.request('POST', kb('/proposals'), {
      runToken: token,
      raw: form,
    });
    expect(changed.body.data).toEqual([
      expect.objectContaining({
        path: 'project/runbooks/queue.md.md',
        error: expect.stringContaining('kb upload --doc queue-md'),
      }),
      expect.objectContaining({
        path: 'project/runbooks/cache.md',
        kind: 'create',
      }),
    ]);

    const ticket = await h.request('POST', kb('/uploadTickets'), {
      runToken: token,
      body: { doc: 'queue-md', reason: 'The runbook changed.' },
    });
    expect(ticket.status).toBe(201);
    expect(ticket.body.data).toMatchObject({
      method: 'POST',
      url: expect.stringMatching(/^\/api\/knowledge\/tickets\/[^/]+\/redeem$/u),
    });
    const sent = await h.request(
      'POST',
      ticket.body.data.url.slice('/api'.length),
      {
        raw: '# Queue\n\nDrain, then restart.',
        headers: {
          ...ticket.body.data.headers,
          'content-disposition': "attachment; filename*=UTF-8''queue.md",
        },
      },
    );
    expect(sent.status).toBe(200);
    expect(sent.body.data).toMatchObject({
      kind: 'update',
      docId: runbook.id,
      baseVersion: 1,
      proposer: { kind: 'agent', id: agentId },
      source: { kind: 'issue' },
      file: { filename: 'queue.md' },
    });
    await knowledge.proposals.accept({ userId: 'alice' }, sent.body.data.id);
    await knowledge.files.idle();
    expect(
      (await knowledge.docs.get({ userId: 'bob' }, runbook.id)).content,
    ).toContain('Drain, then restart.');
  });

  it('offers a person the commands of their own levels, and nothing without them', async () => {
    const manifest = {
      status: 200,
      body: { data: await h.manifest({ user: 'bob' }) },
    };
    expect(
      (manifest.body.data.commands as { id: string }[]).map((c) => c.id),
    ).toContain('kb:read');
    h.roles.set('bob', 'none');
    const none = {
      status: 200,
      body: { data: await h.manifest({ user: 'bob' }) },
    };
    expect(
      (none.body.data.commands as { id: string }[]).map((c) => c.id),
    ).not.toContain('kb:read');
  });
});

describe('nb-studio kb for a person and a run without the actions', () => {
  it('reads the system’s for a person, a project named, and nothing without the read level', async () => {
    const tree = await h.request('GET', kb('/tree'), { user: 'bob' });
    expect(tree.status).toBe(200);
    expect(tree.body.meta.message).toContain('# System (inherited)');
    expect(tree.body.meta.message).not.toContain('known-pitfalls');
    const listed = await h.request(
      'GET',
      kb(`/docs?projectId=${projectId}&parent=known-pitfalls`),
      { user: 'bob' },
    );
    expect(listed.status).toBe(200);
    expect(listed.body.data.map((doc: { slug: string }) => doc.slug)).toEqual([
      'sqlite-locks',
    ]);
    expect(listed.body.meta.total).toBe(1);
    const read = await h.request(
      'GET',
      kb(`/docs/sqlite-locks?projectId=${projectId}`),
      { user: 'bob' },
    );
    expect(read.status).toBe(200);
    expect(read.body.data.url).toContain(read.body.data.id);
    const elsewhere = await h.request('GET', kb('/docs/sqlite-locks'), {
      user: 'bob',
    });
    expect(elsewhere.status).toBe(404);

    h.roles.set('bob', 'none');
    const refused = await h.request('GET', kb('/search?q=commits'), {
      user: 'bob',
    });
    expect(refused.status).toBe(403);
    expect(
      (await h.manifest({ user: 'bob' })).commands.map((c) => c.id),
    ).not.toContain('kb:read');
  });

  it('proposes for a person, as JSON or as a form without files, and refuses an unclear proposal', async () => {
    const created = await h.request('POST', kb('/proposals'), {
      user: 'bob',
      body: {
        title: 'Deploy notes',
        content: '# Deploy notes',
        reason: 'We keep asking.',
        projectId,
      },
    });
    expect(created.status).toBe(201);
    expect(created.body.data).toMatchObject({
      kind: 'create',
      scope: 'project',
      scopeId: projectId,
      proposer: { kind: 'user', id: 'bob' },
    });
    expect(created.body.meta.message).toContain(
      'a new document "Deploy notes"',
    );
    const form = new FormData();
    form.append('doc', 'conventions');
    form.append('verify', 'true');
    form.append('reason', 'Still true.');
    const verified = await h.request('POST', kb('/proposals'), {
      user: 'bob',
      raw: form,
    });
    expect(verified.status).toBe(201);
    expect(verified.body.data.kind).toBe('verify');
    const unclear = await h.request('POST', kb('/proposals'), {
      user: 'bob',
      body: { reason: 'Something.' },
    });
    expect(unclear.status).toBe(400);
    const ticket = await h.request('POST', kb('/uploadTickets'), {
      user: 'bob',
      body: { title: 'Diagram', reason: 'The architecture.' },
    });
    expect(ticket.status).toBe(201);
    const sent = await h.request(
      'POST',
      ticket.body.data.url.slice('/api'.length),
      {
        raw: 'diagram bytes',
        headers: {
          ...ticket.body.data.headers,
          'content-disposition': "attachment; filename*=UTF-8''diagram.txt",
        },
      },
    );
    expect(sent.status).toBe(200);
    expect(sent.body.data).toMatchObject({
      kind: 'create',
      scope: 'system',
      file: { filename: 'diagram.txt' },
    });
  });

  it('refuses a run whose agent may not read or propose knowledge', async () => {
    agentId = await h.createAgent({
      name: 'Plain',
      actions: ['pm.issues/view', 'pm.issues/comment'],
    });
    await startWork();
    const payload = await h.claimOne(withMounts);
    const token = payload.cli.credential.content.token as string;
    expect(
      (await h.manifest({ runToken: token })).commands.map((c) => c.id),
    ).not.toContain('kb:search');
    const search = await h.request('GET', kb('/search?q=commits'), {
      runToken: token,
    });
    expect(search.status).toBe(403);
    const propose = await h.request('POST', kb('/proposals'), {
      runToken: token,
      body: { doc: 'conventions', verify: true, reason: 'Still true.' },
    });
    expect(propose.status).toBe(403);
  });

  it('lets a run that only reads read, and refuses its proposals', async () => {
    agentId = await h.createAgent({
      name: 'Reader',
      actions: ['pm.issues/view', 'kb.knowledge/read'],
    });
    await startWork();
    const payload = await h.claimOne(withMounts);
    const token = payload.cli.credential.content.token as string;
    const ids = (await h.manifest({ runToken: token })).commands.map(
      (c) => c.id,
    );
    expect(ids).toContain('kb:read');
    expect(ids).not.toContain('kb:propose');
    expect(ids).not.toContain('kb:upload');
    expect(
      (await h.request('GET', kb('/docs/conventions'), { runToken: token }))
        .status,
    ).toBe(200);
    const ticket = await h.request('POST', kb('/uploadTickets'), {
      runToken: token,
      body: { title: 'x', reason: 'y' },
    });
    expect(ticket.status).toBe(403);
  });
});

describe('the retrospective rule', () => {
  it('wakes the agent on a finished issue in a thread of its own, with the manual first', async () => {
    h.roles.set('root', 'admin');
    const workflow =
      (await h.projects.workflows.list(h.viewer('root'))).find(
        (item) => item.isDefault,
      ) ??
      (await h.projects.workflows.setDefault(
        h.viewer('root'),
        (
          await h.projects.workflows.create(h.viewer('root'), {
            name: 'Standard',
            copyFrom: null,
          })
        ).id,
      ));
    await h.projects.workflows.update(h.viewer('root'), workflow.id, {
      revision: workflow.revision,
      definition: {
        ...workflow.definition,
        states: workflow.definition.states.map((state) =>
          state.key === 'done'
            ? {
                ...state,
                rules: [{ type: 'retrospective', config: { agentId } }],
              }
            : state,
        ),
      },
    });
    const issue = await h.projects.issues.create(h.viewer('bob'), {
      title: 'Ship it',
      projectId,
    });
    const current = await h.projects.issueQueries.detail(
      h.viewer('bob'),
      issue.id,
    );
    await h.projects.issues.update(h.viewer('bob'), issue.id, {
      revision: current.revision,
      statusKey: 'done',
    });
    const runs = await h.agents.runs.list({
      subjectKind: 'issue',
      subjectId: issue.id,
    });
    expect(runs).toHaveLength(1);
    expect(runs[0]).toMatchObject({
      agentId,
      threadScope: 'retro',
      actorUserId: 'bob',
    });
    const payload = await h.claimOne(withMounts);
    expect(payload.prompt.system).toContain('## Retrospective');
    expect(payload.prompt.system).toContain('## User manual');
    // Only the retrospective is told how to propose, by the narrow standard.
    expect(payload.prompt.system).toContain('## Capture learnings');
    expect(payload.prompt.system).toContain(
      'Do not record the analysis of a particular bug',
    );
    expect(payload.prompt.system).toContain(
      'Prefer updating the document that covers the area over adding a new one',
    );
    // It does not make the agent the executor.
    expect(
      (await h.projects.issueQueries.detail(h.viewer('bob'), issue.id))
        .executor,
    ).toBeNull();
  });
});
