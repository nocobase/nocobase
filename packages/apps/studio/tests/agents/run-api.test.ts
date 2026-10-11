// @vitest-environment node
/**
 * The whole of Studio, started on test databases of its own: an agent's run token is a credential of the application's
 * authentication. A run calls the business routes that list `runToken` within its agent's actions, acting as the agent;
 * is refused a business action its agent does not hold; never reaches a route that does not take a run, nor a person's
 * own. Its command manifest lists what it may run.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  HEADERS,
  PROTOCOL_VERSION,
  type RegisterRequest,
} from '@nocobase/agent-protocol';
import { agentsToken } from '@nocobase/app-plugin-agents/server/tokens';
import {
  projectsAccessToken,
  projectsToken,
  type Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import {
  createTestAppConfig,
  type TestAppConfig,
} from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createStandaloneServer,
  type StandaloneServer,
} from '../../server/standalone.ts';

process.env.AUTH_SECRET ??= 'test-auth-secret-at-least-32-characters';

describe('an agent run calling Studio’s API', () => {
  let server: StandaloneServer;
  let config: TestAppConfig;
  let directory: string;
  let api: string;
  let token: string;
  let identifier: string;

  const call = async (
    method: string,
    route: string,
    options: { body?: unknown; runToken?: string } = {},
  ) => {
    const response = await server.fetch(
      new Request(`${api}${route}`, {
        method,
        headers: {
          [HEADERS.protocol]: String(PROTOCOL_VERSION),
          ...(options.body === undefined
            ? {}
            : { 'content-type': 'application/json' }),
          ...(options.runToken ? { [HEADERS.runToken]: options.runToken } : {}),
        },
        ...(options.body === undefined
          ? {}
          : { body: JSON.stringify(options.body) }),
      }),
    );
    const text = await response.text();
    return {
      status: response.status,
      body: text ? JSON.parse(text) : null,
    } as { status: number; body: any };
  };

  beforeAll(async () => {
    directory = mkdtempSync(path.join(tmpdir(), 'studio-run-api-'));
    config = await createTestAppConfig({
      install: true,
      config: {
        auth: { secret: 'test-auth-secret-at-least-32-characters' },
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
        hub: { host: { enabled: false } },
        logging: { level: 'error', file: { enabled: false } },
      },
    });
    const sourceRoot = path.resolve(import.meta.dirname, '../..');
    server = await createStandaloneServer({
      viteDevUrl: false,
      env: {
        DB_MIGRATIONS_AUTO_RUN: 'true',
        APP_CONFIG_FILE: config.path,
        APP_STORAGE_DIR: path.join(directory, 'storage'),
      },
      paths: {
        rootDir: sourceRoot,
        serverDir: path.join(sourceRoot, 'server'),
        databaseDir: path.join(sourceRoot, 'database'),
        clientDir: path.join(sourceRoot, 'dist/client'),
        storageDir: path.join(directory, 'storage'),
      },
    });
    const { application } = server;
    api = `http://localhost${application.publicBasePath.replace(/\/$/u, '')}/api`;
    const { container } = application;

    // A person, with the application's default role.
    const userId = 'u-ada';
    const now = new Date();
    await container
      .resolve(databaseManagerToken)
      .connection()
      .repository('user')
      .createOne({
        values: {
          id: userId,
          name: 'Ada',
          username: 'ada',
          email: 'ada@example.com',
          emailVerified: true,
          createdAt: now,
          updatedAt: now,
        },
      });
    const projects = container.resolve(projectsToken);
    const access = container.resolve(projectsAccessToken);
    await container
      .resolve(databaseManagerToken)
      .transaction((conn) => access.admit(conn, userId));
    const viewer: Viewer = {
      userId,
      actor: { type: 'user', id: userId },
      permissions: await access.permissionsOfUser!(userId),
    };
    const agents = container.resolve(agentsToken);
    const agent = await agents.agents.create(userId, {
      name: 'Coder',
      modelEntries: [{ tool: 'claude', model: null }],
      access: 'everyone',
      actions: ['pm.issues/view', 'pm.issues/comment'],
    });
    const issue = await projects.issues.create(viewer, { title: 'Fix login' });
    identifier = issue.identifier;
    const current = await projects.issueQueries.detail(viewer, issue.id);
    await projects.issues.update(viewer, issue.id, {
      revision: current.revision,
      executor: { type: 'agent', id: agent.id },
    });

    // A runner takes the run; its token is the run's credential.
    const registration = await agents.runners.createRegistrationToken(userId, {
      trust: 'team',
    });
    const request: RegisterRequest = {
      registrationToken: registration.token,
      name: 'runner',
      hostname: 'host',
      os: 'darwin',
      arch: 'arm64',
      version: '0.0.1',
      protocolVersion: PROTOCOL_VERSION,
      features: ['input', 'checkout', 'directories', 'skills', 'secrets'],
      tools: [{ kind: 'claude', authenticated: true }],
      slots: 1,
    };
    const registered = await call('POST', '/agents/runners/register', {
      body: request,
    });
    if (registered.status !== 200)
      throw new Error(
        `Registration failed: ${JSON.stringify(registered.body)}`,
      );
    const runnerKey = registered.body.data.runnerKey as string;
    const claimed = await server.fetch(
      new Request(`${api}/agents/runners/claim`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          [HEADERS.protocol]: String(PROTOCOL_VERSION),
          [HEADERS.runnerKey]: runnerKey,
        },
        body: JSON.stringify({ free: 1 }),
      }),
    );
    const payload = (
      (await claimed.json()) as {
        data: {
          runs: { cli: { credential: { content: { token: string } } } }[];
        };
      }
    ).data.runs[0]!;
    token = payload.cli.credential.content.token;
  }, 120_000);

  afterAll(async () => {
    await server?.close();
    await config?.dispose();
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  it('calls a business route its agent may use, as the agent', async () => {
    const read = await call('GET', `/projects/issues/${identifier}`, {
      runToken: token,
    });
    expect(read.status).toBe(200);
    expect(read.body.data.identifier).toBe(identifier);
    const posted = await call(
      'POST',
      `/projects/issues/${identifier}/comments`,
      {
        runToken: token,
        body: { content: 'On it.' },
      },
    );
    expect(posted.status).toBe(201);
    expect(posted.body.data.comment).toMatchObject({
      authorType: 'agent',
      content: 'On it.',
    });
  });

  it('is refused a business action its agent does not hold', async () => {
    const edited = await call('PATCH', `/projects/issues/${identifier}`, {
      runToken: token,
      body: { priority: 'high' },
    });
    expect(edited.status).toBe(403);
  });

  it('never reaches a route that does not take a run, nor a person’s own', async () => {
    const labelled = await call('POST', '/projects/labels', {
      runToken: token,
      body: { name: 'bug' },
    });
    expect(labelled.status).toBe(403);
    expect(labelled.body.error.reason).toBe('CREDENTIAL_NOT_ACCEPTED');
    // A route that takes a run names its action; an agent not given it never reaches the route.
    const removed = await call('DELETE', `/projects/issues/${identifier}`, {
      runToken: token,
    });
    expect(removed.status).toBe(403);
    expect(removed.body.error).toMatchObject({
      reason: 'RUN_ACTION_FORBIDDEN',
      metadata: { action: 'pm.issues/delete' },
    });
    for (const route of ['/projects/workflows', '/agents', '/inbox/pending'])
      expect((await call('GET', route, { runToken: token })).status).toBe(403);
    expect(
      (await call('GET', '/projects/issues', { runToken: 'not-a-token' }))
        .status,
    ).toBe(401);
  });

  it('reads its issue’s runs and the agents it may hand work to', async () => {
    const runs = await call('GET', '/issueRuns', { runToken: token });
    expect(runs.status).toBe(200);
    const [own] = runs.body.data as { id: string; agent: string }[];
    expect(own).toMatchObject({ agent: 'Coder' });
    const run = await call('GET', `/issueRuns/${own!.id}`, {
      runToken: token,
    });
    expect(run.status).toBe(200);
    expect(run.body.data.issue.identifier).toBe(identifier);
    expect(run.body.meta.message).toContain(`on ${identifier} Fix login`);
    const events = await call('GET', `/issueRuns/${own!.id}/events`, {
      runToken: token,
    });
    expect(events.status).toBe(200);
    expect(events.body.meta).toHaveProperty('lastSeq');
    const roster = await call('GET', '/agents/available', { runToken: token });
    expect(roster.status).toBe(200);
    // Studio's built-in project lead and role agents too; the built-in assistant has no model yet and is not offered.
    expect(
      (roster.body.data as { name: string }[])
        .map((agent) => agent.name)
        .sort(),
    ).toEqual([
      'Code reviewer',
      'Coder',
      'Developer',
      'Frontend designer',
      'Project lead',
      'Proposal reviewer',
      'Senior developer',
      'Solution designer',
    ]);
    // A run on an issue has no conversation to name.
    const titled = await call('PATCH', '/agents/runs/current/conversation', {
      runToken: token,
      body: { title: 'Nope' },
    });
    expect(titled.status).toBe(400);
  });

  it('lists what the run may run in its manifest', async () => {
    const manifest = await call('GET', '/cli/manifest', { runToken: token });
    expect(manifest.status).toBe(200);
    const ids = (manifest.body.data.commands as { id: string }[]).map(
      (command) => command.id,
    );
    expect(manifest.body.data.identity).toMatchObject({
      kind: 'run',
      userId: 'u-ada',
      displayName: 'Coder',
    });
    expect(ids).toEqual(
      expect.arrayContaining([
        'issue:get',
        'issue:comment:add',
        'issue:search',
        'run:context',
        'agent:list',
        'issue:runs',
        'run:get',
        'run:events',
      ]),
    );
    expect(ids).not.toContain('issue:update');
    expect(ids).not.toContain('app:create');
    expect(ids).not.toContain('label:list');
  });
});
