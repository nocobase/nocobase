// @vitest-environment node
/**
 * Studio's command line, as the whole application derives it from its API document (`GET /api/cli/manifest`): what a
 * person with every permission is offered, and what an agent's run configured with every action may run. Command
 * names, their arguments and flags, the routes they call and who may call them are a contract with the `nb-studio` CLI,
 * with scripts and with agents' habits: the snapshots show every change to them. One line per command:
 * `<words> <args> [flags] -> METHOD path (identities) action`; a flag is `!` when required and `@env` when the CLI reads
 * it from CI's environment when left out.
 */
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Knex } from 'knex';
import { databaseManagerToken } from '@nocobase/db';
import { BRIDGE_PROTOCOL_VERSION } from '../../../../libs/acp-bridge/src/protocol.js';
import { agentSessionsToken } from '@nocobase/app-plugin-agent-sessions/server';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  HEADERS,
  PROTOCOL_VERSION,
  type RegisterRequest,
} from '@nocobase/agent-protocol';
import {
  agentsToken,
  runnerAgentId,
} from '@nocobase/app-plugin-agents/server/tokens';
import {
  projectsAccessToken,
  projectsToken,
  type Viewer,
} from '@nocobase/app-plugin-projects/server/tokens';
import type { CliCommand, CliManifest } from '@nocobase/app-server/router';
import {
  createTestAppConfig,
  type TestAppConfig,
} from '@nocobase/app-testing/server';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createStandaloneServer,
  type StandaloneServer,
} from '../../server/standalone.ts';

process.env.AUTH_SECRET ??= 'test-auth-secret-at-least-32-characters';

/** A command on one line: its words, arguments and flags, the request it makes, who may make it and its action. */
function line(command: CliCommand): string {
  const args = command.parameters
    .filter((parameter) => parameter.position !== undefined)
    .map((parameter) =>
      parameter.required ? `<${parameter.name}>` : `[${parameter.name}]`,
    );
  const flags = command.parameters
    .filter((parameter) => parameter.position === undefined)
    .map(
      (parameter) =>
        `--${parameter.name}${parameter.required ? '!' : ''}${parameter.env?.length ? '@env' : ''}`,
    );
  if (command.body?.file) flags.push(`--${command.body.file}`);
  return [
    command.id.split(':').join(' '),
    ...args,
    ...(flags.length > 0 ? [`[${flags.join(' ')}]`] : []),
    '->',
    command.method,
    command.path.replace(/^\/[^/]*(?=\/api\/)/u, ''),
    `(${command.identities.join(',')})`,
    ...(command.action ? [command.action] : []),
    ...(command.confirm ? ['confirm'] : []),
  ].join(' ');
}

describe('Studio’s command manifest', () => {
  let server: StandaloneServer;
  let config: TestAppConfig;
  let directory: string;
  let api: string;
  let cookie: string;
  let token: string;

  const request = (route: string, init: RequestInit = {}) =>
    server.fetch(
      new Request(`${api}${route}`, {
        ...init,
        headers: {
          [HEADERS.protocol]: String(PROTOCOL_VERSION),
          ...(init.body === undefined
            ? {}
            : { 'content-type': 'application/json' }),
          ...(init.headers as Record<string, string> | undefined),
        },
      }),
    );

  const manifestOf = async (
    headers: Record<string, string>,
  ): Promise<CliManifest> => {
    const response = await request('/cli/manifest', { headers });
    if (response.status !== 200)
      throw new Error(
        `The manifest answered ${response.status}: ${await response.text()}`,
      );
    return ((await response.json()) as { data: CliManifest }).data;
  };

  beforeAll(async () => {
    directory = mkdtempSync(path.join(tmpdir(), 'nb-studio-cli-manifest-'));
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
        DB_SEEDS_AUTO_RUN: 'true',
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

    // The installation's first administrator, who holds every permission.
    const signIn = await request('/auth/sign-in/username', {
      method: 'POST',
      body: JSON.stringify({ username: 'nocobase', password: 'admin123' }),
    });
    if (signIn.status !== 200)
      throw new Error(`Signing in failed: ${await signIn.text()}`);
    cookie = signIn.headers
      .getSetCookie()
      .map((header) => header.split(';')[0])
      .join('; ');
    const me = (await (
      await request('/auth/get-session', { headers: { cookie } })
    ).json()) as { user: { id: string } };

    // An agent discovered from the runner's report and enabled, with the actions every such agent holds, working on a
    // step the administrator handed it on an issue.
    const agents = application.container.resolve(agentsToken);
    const registration = await agents.runners.createRegistrationToken(
      me.user.id,
      { trust: 'team' },
    );
    const register: RegisterRequest = {
      registrationToken: registration.token,
      name: 'runner',
      hostname: 'host',
      os: 'darwin',
      arch: 'arm64',
      version: '0.0.1',
      protocolVersion: PROTOCOL_VERSION,
      features: ['input', 'checkout', 'directories', 'skills', 'secrets'],
      tools: [
        {
          kind: 'claude',
          authenticated: true,
          models: [{ id: 'claude-sonnet-4-5' }],
        },
      ],
      slots: 1,
    };
    const registered = await request('/agents/runners/register', {
      method: 'POST',
      body: JSON.stringify(register),
    });
    const runnerKey = (
      (await registered.json()) as { data: { runnerKey: string } }
    ).data.runnerKey;
    const agentId = runnerAgentId('claude', 'claude-sonnet-4-5');
    const discovered = await agents.agents.get(agentId);
    await agents.agents.update(agentId, me.user.id, {
      description: 'Writes and fixes code.',
      enabled: true,
      expectedRevision: discovered.revision,
    });
    const access = application.container.resolve(projectsAccessToken);
    const viewer: Viewer = {
      userId: me.user.id,
      actor: { type: 'user', id: me.user.id },
      permissions: await access.permissionsOfUser!(me.user.id),
    };
    const projects = application.container.resolve(projectsToken);
    const issue = await projects.issues.create(viewer, {
      title: 'Fix login',
      executor: null,
      statusKey: 'in_progress',
      start: false,
    });
    await projects.comments.post({ type: 'user', id: me.user.id }, issue.id, {
      content: `[@Coder](mention://agent/${agentId}) fix it`,
    });
    const claimed = await request('/agents/runners/claim', {
      method: 'POST',
      headers: { [HEADERS.runnerKey]: runnerKey },
      body: JSON.stringify({ free: 1 }),
    });
    const payload = (
      (await claimed.json()) as {
        data: {
          runs: { cli: { credential: { content: { token: string } } } }[];
        };
      }
    ).data.runs[0];
    if (!payload) throw new Error('No run was claimed.');
    token = payload.cli.credential.content.token;
  }, 180_000);

  afterAll(async () => {
    await server?.close();
    await config?.dispose();
    if (directory) rmSync(directory, { recursive: true, force: true });
  });

  it('offers a person every Studio area, and nothing Studio does not serve', async () => {
    const manifest = await manifestOf({ cookie });
    expect(manifest.identity.kind).toBe('person');
    expect(manifest.identity.settings).toEqual(
      expect.arrayContaining([
        'agents.agents/read',
        'agents.runners/manage',
        'agents.services/manage',
        'rel.environments/manage',
        'studio.git/manage',
        'studio.apiKeys/manage',
      ]),
    );
    expect(manifest.identity.actions).not.toContain('agents.runners/read');
    expect(
      manifest.commands
        .find((command) => command.id === 'issue:update')
        ?.parameters.map((parameter) => parameter.name),
    ).toEqual(expect.arrayContaining(['needs-you', 'next']));
    const lines = manifest.commands.map(line);
    expect(lines.join('\n')).toMatchSnapshot();
    for (const command of manifest.commands) {
      for (const parameter of command.parameters)
        expect(parameter.description).toBeTruthy();
      expect(command.path).not.toMatch(/\/api\/auth\//u);
      expect(command.id).not.toMatch(/^authentication:/u);
    }
  });

  it('shows only a member’s settings and the settings allowed by a restricted API key', async () => {
    const created = await request('/users', {
      method: 'POST',
      headers: { cookie, origin: 'http://localhost' },
      body: JSON.stringify({
        name: 'Member',
        username: 'climember',
        email: 'climember@example.test',
        password: 'member-test-password',
        roleScopes: { studio: ['contributor'] },
      }),
    });
    expect(created.status).toBe(201);
    const signed = await request('/auth/sign-in/username', {
      method: 'POST',
      body: JSON.stringify({
        username: 'climember',
        password: 'member-test-password',
      }),
    });
    expect(signed.status).toBe(200);
    const memberCookie = signed.headers
      .getSetCookie()
      .map((header) => header.split(';')[0])
      .join('; ');
    const member = await manifestOf({ cookie: memberCookie });
    expect(member.identity.settings).not.toContain('agents.runners/manage');
    expect(member.identity.settings).not.toContain('studio.apiKeys/manage');
    const key = await request('/apiKeys', {
      method: 'POST',
      headers: { cookie, origin: 'http://localhost' },
      body: JSON.stringify({
        name: 'read-issues',
        expiresInDays: null,
        scope: { groups: { 'projects.issues': { level: 'read' } } },
      }),
    });
    expect(key.status).toBe(201);
    const secret = ((await key.json()) as { data: { secret: string } }).data
      .secret;
    const restricted = await manifestOf({ 'x-api-key': secret });
    expect(restricted.identity.settings).toEqual([]);
    expect(restricted.identity.actions).toContain('pm.issues/view');
    expect(restricted.identity.actions).not.toContain('pm.issues/delete');
  });

  it('offers a run what its agent may do, on the routes that take a run token', async () => {
    const manifest = await manifestOf({ [HEADERS.runToken]: token });
    expect(manifest.identity.kind).toBe('run');
    expect(manifest.identity.settings).toEqual([]);
    for (const decision of ['get', 'accept', 'reject']) {
      expect(
        manifest.commands.some(
          (command) => command.id === `issue:handoff:${decision}`,
        ),
      ).toBe(false);
      expect(manifest.withheld).toContainEqual(
        expect.objectContaining({
          id: `issue:handoff:${decision}`,
          reason: 'identity',
        }),
      );
    }
    expect(
      manifest.commands
        .find((command) => command.id === 'issue:update')
        ?.parameters.map((parameter) => parameter.name),
    ).toEqual(expect.arrayContaining(['needs-you', 'next']));
    expect(manifest.commands.map(line).join('\n')).toMatchSnapshot();
    for (const command of manifest.commands)
      expect(command.identities).toContain('run');
  });

  it('documents the run token as a credential of the manifest itself', async () => {
    const document = (await (
      await request('/swagger', { headers: { cookie } })
    ).json()) as {
      paths: Record<string, { get?: { security?: unknown } }>;
    };
    expect(document.paths['/api/cli/manifest']?.get?.security).toEqual(
      expect.arrayContaining([{ runToken: [] }]),
    );
  });
  it('creates and reads session work through the real CLI routes with existing permissions and batch progress', async () => {
    const manifest = await manifestOf({ cookie });
    expect(
      manifest.commands
        .find((command) => command.id === 'session:work')
        ?.parameters.find((parameter) => parameter.field === 'sessionId')?.env,
    ).toEqual(['NB_STUDIO_AGENT_SESSION']);
    const { container } = server.application;
    const sessions = container.resolve(agentSessionsToken);
    const projects = container.resolve(projectsToken);
    const me = (await (
      await request('/auth/get-session', { headers: { cookie } })
    ).json()) as { user: { id: string }; session: { token: string } };
    const userId = me.user.id;
    const viewer: Viewer = {
      userId,
      actor: { type: 'user', id: userId },
      permissions:
        await container.resolve(projectsAccessToken).permissionsOfUser!(userId),
    };
    const project = await projects.projects.create(viewer, {
      name: 'CLI session integration',
    });
    const { computerId } = await sessions.register(userId, {
      protocol: BRIDGE_PROTOCOL_VERSION,
      computerId: null,
      computer: {
        name: 'Test laptop',
        platform: 'linux',
        arch: 'x64',
        host: 'test',
        roots: ['/workspace'],
        agents: [{ id: 'codex', name: 'Codex', version: 'test' }],
      },
    });
    const session = await sessions.createSession(
      { userId },
      {
        computerId,
        agentId: 'codex',
        projectId: project.id,
        cwd: '/workspace',
        content: [{ type: 'text', text: 'Plan related work.' }],
      },
    );
    const scope = new AsyncLocalStorage<symbol>();
    const client = await container
      .resolve(databaseManagerToken)
      .connection()
      .client<Knex>();
    const measure = async () => {
      const mark = Symbol('session-work');
      const sql: string[] = [];
      const listener = (query: { sql: string }) => {
        if (scope.getStore() === mark) sql.push(query.sql);
      };
      client.on('query', listener);
      try {
        await scope.run(mark, () =>
          sessions.sessionWork({ userId }, session.id),
        );
      } finally {
        client.removeListener('query', listener);
      }
      expect(
        sql.filter((query) =>
          /^(insert|update|delete|begin|commit)\b|\bfor\s+update\b/iu.test(
            query,
          ),
        ),
      ).toEqual([]);
      return sql.length;
    };
    await sessions.sessionWork({ userId }, session.id);
    const empty = await measure();
    const headers = {
      authorization: `Bearer ${me.session.token}`,
      'x-nb-agent-session': session.id,
    };
    const made: string[] = [];
    for (const title of ['First linked task', 'Second linked task']) {
      const response = await request('/projects/issues', {
        method: 'POST',
        headers,
        body: JSON.stringify({ title }),
      });
      expect(response.status).toBe(201);
      const issue = (
        (await response.json()) as {
          data: { id: string; projectId: string; statusKey: string };
        }
      ).data;
      expect(issue).toMatchObject({
        projectId: project.id,
        statusKey: 'backlog',
      });
      made.push(issue.id);
    }
    const response = await request(
      `/agentSessions/sessions/${session.id}/work`,
      { headers: { cookie } },
    );
    expect(response.status).toBe(200);
    const work = (
      (await response.json()) as {
        data: { refId: string; progress: unknown }[];
      }
    ).data;
    expect(work.map((item) => item.refId)).toEqual(made);
    expect(work.every((item) => item.progress !== null)).toBe(true);
    await sessions.sessionWork({ userId }, session.id);
    const multiple = await measure();
    process.stdout.write(
      `Session work SQL reads: empty=${empty}, two tasks=${multiple}; writes/locks/transactions=0.\n`,
    );
    expect(
      (
        await request('/projects/issues', {
          method: 'POST',
          headers: {
            authorization: `Bearer ${me.session.token}`,
            'x-nb-agent-session': 'missing',
          },
          body: JSON.stringify({ title: 'Refused' }),
        })
      ).status,
    ).toBe(403);
    await sessions.updateSession({ userId }, session.id, { archived: true });
    expect(
      (
        await request('/projects/issues', {
          method: 'POST',
          headers,
          body: JSON.stringify({ title: 'Archived' }),
        })
      ).status,
    ).toBe(403);
    expect(
      (await request(`/agentSessions/sessions/${session.id}/work`)).status,
    ).toBe(401);
    expect(
      (
        await request(`/agentSessions/sessions/${session.id}/work`, {
          headers: { [HEADERS.runToken]: token },
        })
      ).status,
    ).not.toBe(200);
  });
});
