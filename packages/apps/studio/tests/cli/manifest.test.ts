// @vitest-environment node
/**
 * Studio's command line, as the whole application derives it from its API document (`GET /api/cli/manifest`): what a
 * person with every permission is offered, and what an agent's run configured with every action may run. Command
 * names, their arguments and flags, the routes they call and who may call them are a contract with the `nb-studio` CLI,
 * with scripts and with agents' habits: the snapshots show every change to them. One line per command:
 * `<words> <args> [flags] -> METHOD path (identities) action`; a flag is `!` when required and `@env` when the CLI reads
 * it from CI's environment when left out.
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

    // An agent configured with every action an agent may hold, working on an issue the administrator gave it.
    const agents = application.container.resolve(agentsToken);
    const agent = await agents.agents.create(me.user.id, {
      name: 'Coder',
      modelEntries: [{ tool: 'claude', model: null }],
      access: 'everyone',
      actions: [...agents.actions.keys()],
    });
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
      tools: [{ kind: 'claude', authenticated: true }],
      slots: 1,
    };
    const registered = await request('/agents/runners/register', {
      method: 'POST',
      body: JSON.stringify(register),
    });
    const runnerKey = (
      (await registered.json()) as { data: { runnerKey: string } }
    ).data.runnerKey;
    const access = application.container.resolve(projectsAccessToken);
    const viewer: Viewer = {
      userId: me.user.id,
      actor: { type: 'user', id: me.user.id },
      permissions: await access.permissionsOfUser!(me.user.id),
    };
    const projects = application.container.resolve(projectsToken);
    const issue = await projects.issues.create(viewer, { title: 'Fix login' });
    const current = await projects.issueQueries.detail(viewer, issue.id);
    await projects.issues.update(viewer, issue.id, {
      revision: current.revision,
      executor: { type: 'agent', id: agent.id },
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
    const lines = manifest.commands.map(line);
    expect(lines.join('\n')).toMatchSnapshot();
    for (const command of manifest.commands) {
      expect(command.path).not.toMatch(/\/api\/auth\//u);
      expect(command.id).not.toMatch(/^authentication:/u);
    }
  });

  it('offers a run what its agent may do, on the routes that take a run token', async () => {
    const manifest = await manifestOf({ [HEADERS.runToken]: token });
    expect(manifest.identity.kind).toBe('run');
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
});
