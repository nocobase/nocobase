// @vitest-environment node
/** Real Studio startup on disposable databases, with HTTP runner protocol driving controlled terminal timing. */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import {
  createTestAppConfig,
  type TestAppConfig,
} from '@nocobase/app-testing/server';
import {
  startNodeAppServer,
  closeNodeServer,
  type NodeAppHttpServer,
} from '@nocobase/app-server/node';
import { databaseManagerToken } from '@nocobase/db';
import { HEADERS, PROTOCOL_VERSION } from '@nocobase/agent-protocol';
import {
  agentsToken,
  runnerAgentId,
  type Agents,
} from '@nocobase/app-plugin-agents/server/tokens';
import {
  projectsToken,
  projectsAccessToken,
  type Projects,
  type Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import runnerMetadata from '../../../../app/agent-runner/package.json' with { type: 'json' };
import {
  createStandaloneServer,
  type StandaloneServer,
} from '../../server/standalone.js';
import { studioProjectManagerToken } from '../../server/agents/manager/token.js';
import { PROJECT_MANAGER_ID } from '../../shared/project-manager.js';
import { createGitFlow } from '../../server/git/flow.js';
import { ensureRepo, insertLink } from '../../server/git/store.js';
import type { PullRequestSnapshot } from '../../server/git/platform.js';

let server: StandaloneServer;
let http: NodeAppHttpServer;
let config: TestAppConfig;
let directory: string;
let api: string;
let key: string;
let agents: Agents;
let projects: Projects;
let viewer: Viewer;
const worker = runnerAgentId('claude', 'pm313-test');
const tokens = new Map<string, string>();
const evidence: Record<string, unknown>[] = [];

async function call(route: string, body: unknown, runId?: string) {
  const response = await fetch(`${api}${route}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      [HEADERS.protocol]: String(PROTOCOL_VERSION),
      ...(runId
        ? { [HEADERS.runToken]: tokens.get(runId)! }
        : { [HEADERS.runnerKey]: key ?? '' }),
    },
    body: JSON.stringify(body),
  });
  return { status: response.status, body: await response.json() };
}
async function start(agentId: string) {
  const claim = await call('/agents/runners/claim', { free: 1 });
  expect(claim.status).toBe(200);
  const payload = claim.body.data.runs[0];
  if (!payload)
    throw new Error(
      `No run claimed; queued work: ${JSON.stringify((await agents.runs.list({})).map((r) => ({ id: r.id, status: r.status, agentId: r.agentId })))}`,
    );
  expect((await agents.runs.detail(payload.run.id)).agentId).toBe(agentId);
  const id = String(payload.run.id);
  tokens.set(id, payload.cli.credential.content.token);
  expect(
    (
      await call(`/agents/runners/runs/${id}/start`, {
        workDir: directory,
        adapter: { kind: 'claude' },
        acceptsInput: true,
      })
    ).status,
  ).toBe(200);
  return id;
}
async function complete(id: string, summary: string) {
  const inputs = (await agents.runs.detail(id)).inputs;
  expect(
    (
      await call(`/agents/runners/runs/${id}/complete`, {
        summary,
        handledInputIds: inputs.map((i) => i.id),
      })
    ).status,
  ).toBe(200);
}
async function step(title: string) {
  const issue = await projects.issues.create(viewer, {
    title,
    statusKey: 'in_progress',
    executor: { type: 'agent', id: PROJECT_MANAGER_ID },
  });
  const manager = await start(PROJECT_MANAGER_ID);
  const dispatch = await call(
    `/projects/issues/${issue.identifier}/comments`,
    {
      content: `Next: Waiting for worker run to end\n\n[@Worker](mention://agent/${worker}) Report the controlled test result.`,
    },
    manager,
  );
  expect(dispatch.status).toBe(201);
  await complete(manager, 'Delegated the step.');
  const workerRun = await start(worker);
  return {
    issue,
    workerRun,
    dispatch: dispatch.body.data.comment.id as string,
  };
}
async function terminalInput(issueId: string) {
  const runs = await agents.runs.list({
    subjectKind: 'issue',
    subjectId: issueId,
    agentId: PROJECT_MANAGER_ID,
  });
  return (await Promise.all(runs.map((r) => agents.runs.detail(r.id))))
    .flatMap((r) => r.inputs)
    .filter(
      (i) =>
        (i.payload as { trigger?: string } | null)?.trigger === 'stepEnded',
    );
}

beforeAll(async () => {
  directory = mkdtempSync(path.join(tmpdir(), 'pm313-studio-'));
  config = await createTestAppConfig({
    install: true,
    config: {
      auth: { secret: 'pm313-test-auth-secret-at-least-32-characters' },
      releases: { host: { enabled: false } },
      agents: { vectors: { store: false } },
      studio: { git: { poll: false } },
      jobs: {
        default: 'memory',
        memory: {
          adapter: 'memory',
          persistence: { path: path.join(directory, 'jobs') },
        },
      },
      queue: {
        default: 'memory',
        memory: {
          adapter: 'inMemory',
          persistence: { path: path.join(directory, 'queue') },
        },
      },
      logging: { level: 'error', file: { enabled: false } },
    },
  });
  const root = path.resolve(import.meta.dirname, '../..');
  server = await createStandaloneServer({
    viteDevUrl: false,
    env: {
      APP_CONFIG_FILE: config.path,
      APP_STORAGE_DIR: directory,
      RELEASES_HOST_ENABLED: 'false',
      NOCOBASE_STRICT_STARTUP: 'true',
    },
    paths: {
      rootDir: root,
      serverDir: path.join(root, 'server'),
      databaseDir: path.join(root, 'database'),
      clientDir: path.join(root, 'dist/client'),
      storageDir: directory,
    },
  });
  http = await startNodeAppServer(server, {
    hostname: '127.0.0.1',
    port: 0,
    registerProcessSignals: false,
  });
  api = `http://127.0.0.1:${(http.address() as AddressInfo).port}${server.application.publicBasePath}/api`;
  const container = server.application.container;
  const database = container.resolve(databaseManagerToken);
  const now = new Date();
  await database
    .connection()
    .repository('user')
    .createOne({
      values: {
        id: 'pm313-owner',
        name: 'Test owner',
        username: 'pm313-owner',
        email: 'pm313@example.com',
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    });
  const access = container.resolve(projectsAccessToken);
  await database.transaction((conn) => access.admit(conn, 'pm313-owner'));
  viewer = {
    userId: 'pm313-owner',
    actor: { type: 'user', id: 'pm313-owner' },
    permissions: await access.permissionsOfUser!('pm313-owner'),
  };
  agents = container.resolve(agentsToken);
  projects = container.resolve(projectsToken);
  const registration = await agents.runners.createRegistrationToken(
    viewer.userId,
    { trust: 'team' },
  );
  const registered = await call('/agents/runners/register', {
    registrationToken: registration.token,
    name: 'PM313 local test runner',
    hostname: 'test-host',
    os: 'linux',
    arch: 'arm64',
    version: runnerMetadata.version,
    protocolVersion: PROTOCOL_VERSION,
    features: [
      'workspaceKey',
      'input',
      'checkout',
      'directories',
      'skills',
      'secrets',
    ],
    tools: [
      { kind: 'claude', authenticated: true, models: [{ id: 'pm313-test' }] },
    ],
    slots: 2,
  });
  if (registered.status !== 200)
    throw new Error('The local test runner could not register.');
  key = registered.body.data.runnerKey;
  const found = await agents.agents.get(worker);
  await agents.agents.update(worker, viewer.userId, {
    enabled: true,
    description: 'Drives controlled lifecycle verification.',
    expectedRevision: found.revision,
  });
  await container
    .resolve(studioProjectManagerToken)
    .update(viewer.userId, { firstChoiceAgentId: worker });
}, 180_000);

afterAll(async () => {
  if (http) await closeNodeServer(http);
  await server?.close();
  await config?.dispose();
  if (directory) rmSync(directory, { recursive: true, force: true });
  process.stdout.write(`PM313 runtime evidence: ${JSON.stringify(evidence)}\n`);
});

it('automatically resumes after a worker replies while running and completes after the manager waited', async () => {
  const { issue, workerRun, dispatch } = await step('Reply before terminal');
  expect(
    (
      await call(
        `/projects/issues/${issue.identifier}/comments`,
        {
          parentId: dispatch,
          content:
            'Controlled worker result is ready; this run is still running.',
        },
        workerRun,
      )
    ).status,
  ).toBe(201);
  const waiting = await start(PROJECT_MANAGER_ID);
  expect((await agents.runs.detail(workerRun)).status).toBe('running');
  await complete(waiting, 'Read running worker; waiting for terminal.');
  await complete(workerRun, 'Controlled worker result.');
  await vi.waitFor(
    async () => expect(await terminalInput(issue.id)).toHaveLength(1),
    { timeout: 10_000 },
  );
  const resumed = await start(PROJECT_MANAGER_ID);
  const ended = await agents.runs.detail(workerRun);
  evidence.push({
    case: 'reply-before-terminal',
    workerRun,
    workerFinishedAt: ended.finishedAt,
    waitingManagerRun: waiting,
    waitingManagerFinishedAt: (await agents.runs.detail(waiting)).finishedAt,
    resumedManagerStartedAt: (await agents.runs.detail(resumed)).startedAt,
    resumedManagerRun: resumed,
    input: (await terminalInput(issue.id)).map((i) => ({
      id: i.id,
      createdAt: i.createdAt,
      payload: i.payload,
    })),
  });
  expect(
    (await projects.commentQueries.list(projects.tx.read(), issue.id)).filter(
      (c) => c.authorId === worker,
    ),
  ).toHaveLength(1);
  await complete(resumed, 'Terminal input received; ready for next step.');
}, 30_000);

it('combines an automatic no-reply report with one terminal input', async () => {
  const { issue, workerRun } = await step('No worker reply');
  await complete(workerRun, 'The controlled step finished without a comment.');
  await vi.waitFor(
    async () => expect(await terminalInput(issue.id)).toHaveLength(1),
    { timeout: 10_000 },
  );
  expect(
    (await projects.commentQueries.list(projects.tx.read(), issue.id)).filter(
      (c) => c.authorId === worker,
    ),
  ).toHaveLength(1);
  const resumed = await start(PROJECT_MANAGER_ID);
  evidence.push({
    case: 'no-reply-terminal',
    workerRun,
    resumedManagerRun: resumed,
    inputCount: (await terminalInput(issue.id)).length,
  });
  await complete(resumed, 'Automatic report and terminal input received.');
}, 30_000);

it('retains CI arriving while the manager runs and refuses completion until it is handled', async () => {
  const issue = await projects.issues.create(viewer, {
    title: 'CI while manager runs',
    statusKey: 'in_progress',
    executor: { type: 'agent', id: PROJECT_MANAGER_ID },
  });
  const managerRun = await start(PROJECT_MANAGER_ID);
  const original = (await agents.runs.detail(managerRun)).inputs.map(
    (i) => i.id,
  );
  const repo = await ensureRepo(
    projects.tx.read(),
    'https://api.github.com',
    'pm313/test',
  );
  const snapshot: PullRequestSnapshot = {
    number: 1,
    url: 'https://github.com/pm313/test/pull/1',
    title: 'Controlled CI',
    state: 'open',
    draft: false,
    headRef: 'agent/test',
    baseRef: 'v3-develop',
    headSha: 'test-head',
    authorLogin: 'test',
    mergeableState: 'clean',
    mergedAt: null,
    mergedByLogin: null,
    mergeCommitSha: null,
    closedAt: null,
  };
  const flow = createGitFlow({
    projects: () => projects,
    agents: () => agents,
    inbox: () => undefined,
    onError: (_message, error) => {
      throw error;
    },
  });
  const pr = await flow.store(repo, snapshot);
  await insertLink(projects.tx.read(), {
    issueId: issue.id,
    pullRequestId: pr.id,
    linkedByType: 'user',
    linkedById: viewer.userId,
  });
  await flow.store(repo, snapshot, {
    ci: {
      ciState: 'success',
      checks: [
        {
          kind: 'check',
          name: 'test',
          status: 'completed',
          conclusion: 'success',
          url: null,
        },
      ],
      statusEtag: null,
      runsEtag: null,
    },
  });
  const before = await call(`/agents/runners/runs/${managerRun}/complete`, {
    summary: 'Finished before noticing CI.',
    handledInputIds: original,
  });
  expect(before.status).toBe(400);
  expect(before.body.error.reason).toBe('RUN_INPUT_PENDING');
  const inputs = (await agents.runs.detail(managerRun)).inputs;
  expect(
    inputs.filter(
      (i) =>
        (i.payload as { trigger?: string } | null)?.trigger ===
        'prChecksPassed',
    ),
  ).toHaveLength(1);
  evidence.push({
    case: 'ci-during-manager',
    managerRun,
    pendingCompletionStatus: before.status,
    ciInput: inputs
      .filter(
        (i) =>
          (i.payload as { trigger?: string } | null)?.trigger ===
          'prChecksPassed',
      )
      .map((i) => ({ id: i.id, payload: i.payload })),
  });
  await complete(managerRun, 'CI input handled.');
}, 30_000);

it.each(['ci-first', 'complete-first'])(
  'keeps CI input across overlapping %s commits',
  async (order) => {
    const issue = await projects.issues.create(viewer, {
      title: `Concurrent ${order}`,
      statusKey: 'in_progress',
      executor: { type: 'agent', id: PROJECT_MANAGER_ID },
    });
    const managerRun = await start(PROJECT_MANAGER_ID);
    const original = (await agents.runs.detail(managerRun)).inputs.map(
      (i) => i.id,
    );
    const repo = await ensureRepo(
      projects.tx.read(),
      'https://api.github.com',
      `pm313/${order}`,
    );
    const snapshot: PullRequestSnapshot = {
      number: 1,
      url: `https://github.com/pm313/${order}/pull/1`,
      title: 'Concurrent CI',
      state: 'open',
      draft: false,
      headRef: 'agent/test',
      baseRef: 'v3-develop',
      headSha: order,
      authorLogin: 'test',
      mergeableState: 'clean',
      mergedAt: null,
      mergedByLogin: null,
      mergeCommitSha: null,
      closedAt: null,
    };
    const flow = createGitFlow({
      projects: () => projects,
      agents: () => agents,
      inbox: () => undefined,
      onError: (_message, error) => {
        throw error;
      },
    });
    const pr = await flow.store(repo, snapshot);
    await insertLink(projects.tx.read(), {
      issueId: issue.id,
      pullRequestId: pr.id,
      linkedByType: 'user',
      linkedById: viewer.userId,
    });
    let enter!: () => void;
    let release!: () => void;
    const entered = new Promise<void>((resolve) => {
      enter = resolve;
    });
    const released = new Promise<void>((resolve) => {
      release = resolve;
    });
    const signal = () =>
      flow.store(repo, snapshot, {
        ci: {
          ciState: 'success',
          checks: [
            {
              kind: 'check',
              name: 'test',
              status: 'completed',
              conclusion: 'success',
              url: null,
            },
          ],
          statusEtag: null,
          runsEtag: null,
        },
      });
    const finish = () =>
      call(`/agents/runners/runs/${managerRun}/complete`, {
        summary: 'Concurrent completion.',
        handledInputIds: original,
      });
    if (order === 'ci-first') {
      const enqueue = agents.runs.enqueue.bind(agents.runs);
      const spy = vi
        .spyOn(agents.runs, 'enqueue')
        .mockImplementation(async (request, tx) => {
          if (
            (request.input.payload as { trigger?: string } | null)?.trigger ===
            'prChecksPassed'
          ) {
            enter();
            await released;
          }
          return enqueue(request, tx);
        });
      const storing = signal();
      await entered;
      const finishing = finish();
      release();
      await storing;
      expect((await finishing).body.error.reason).toBe('RUN_INPUT_PENDING');
      spy.mockRestore();
      await complete(managerRun, 'Handled overlapping CI input.');
    } else {
      const sink = agents.subjects.get('issue')!.sink!;
      const originalSink = sink.onRunFinished!.bind(sink);
      const spy = vi
        .spyOn(sink, 'onRunFinished')
        .mockImplementation(async (tx, run) => {
          if (run.id === managerRun) {
            enter();
            await released;
          }
          await originalSink(tx, run);
        });
      const finishing = finish();
      await entered;
      const storing = signal();
      release();
      expect((await finishing).status).toBe(200);
      await storing;
      spy.mockRestore();
      const resumed = await start(PROJECT_MANAGER_ID);
      expect(resumed).not.toBe(managerRun);
      await complete(resumed, 'Handled CI after prior run completed.');
    }
    const runs = await agents.runs.list({
      subjectKind: 'issue',
      subjectId: issue.id,
    });
    const inputs = (
      await Promise.all(runs.map((r) => agents.runs.detail(r.id)))
    )
      .flatMap((r) => r.inputs)
      .filter(
        (i) =>
          (i.payload as { trigger?: string } | null)?.trigger ===
          'prChecksPassed',
      );
    expect(inputs).toHaveLength(1);
    evidence.push({
      case: order,
      managerRun,
      inputIds: inputs.map((i) => i.id),
      inputCount: inputs.length,
    });
  },
  30_000,
);
