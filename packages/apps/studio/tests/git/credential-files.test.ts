// @vitest-environment node
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import {
  parseCommandLine,
  type CliCommand,
} from '@nocobase/app-cli-client/parse';
import { fillRequest } from '@nocobase/app-cli-client/request';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

import { INSTALLATION_TOKENS } from '../../server/git/installation-tokens.js';
import { CONNECTIONS } from '../../server/git/connections.js';
import {
  createBridgeHarness,
  type BridgeHarness,
} from '../agents/bridge-harness.js';
import { API, tokenConnection } from './helpers.js';

let h: BridgeHarness;
let dir: string;
let commands: readonly CliCommand[];
const secrets = [
  'token',
  'privateKey',
  'clientSecret',
  'webhookSecret',
] as const;
const flagOf = (key: string) =>
  key.replace(/[A-Z]/gu, (c) => `-${c.toLowerCase()}`);

beforeEach(async () => {
  h = await createBridgeHarness();
  await h.addUser('alice');
  h.roles.set('alice', 'admin');
  dir = await mkdtemp(path.join(tmpdir(), 'git-credential-files-'));
  const response = await h.app.request('/cli/manifest', {
    headers: { 'x-test-user': 'alice' },
  });
  if (response.status !== 200)
    throw new Error('The CLI manifest is unavailable.');
  commands = ((await response.json()) as { data: { commands: CliCommand[] } })
    .data.commands;
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
  await h.close();
});

const mutate = vi.fn(async (request: ReturnType<typeof fillRequest>) =>
  h.app.request(request.path.replace(/^\/api(?=\/)/u, ''), {
    method: request.method,
    headers: { 'x-test-user': 'alice', 'content-type': 'application/json' },
    body: JSON.stringify(request.fields),
  }),
);
async function cli(action: 'create' | 'update', args: string[]) {
  const command = commands.find((c) => c.id === `git:connection:${action}`)!;
  expect(command).toBeDefined();
  const call = await parseCommandLine(command, args, {
    bin: 'nb-studio',
    io: {
      env: () => undefined,
      readText: (file) =>
        readFile(path.join(dir, file), 'utf8').catch(() => undefined),
    },
  });
  return mutate(fillRequest(command, call.values, call.bodyFile));
}
const rows = () =>
  h.projects.tx.read().query.selectFrom(CONNECTIONS).selectAll().execute();
async function appConnection() {
  h.github.app.installations.set('acme', '77');
  return h.gitConnections.create('alice', {
    kind: 'app',
    name: 'App',
    account: 'acme',
    appId: h.github.app.appId,
    privateKey: h.github.app.privateKey,
    clientId: h.github.app.clientId,
    clientSecret: h.github.app.clientSecret,
    webhookSecret: 'whsec-test-0123456789',
  });
}

it('rejects all empty, whitespace-only and unreadable credential files before create or update, preserving storage', async () => {
  const app = await appConnection();
  const token = await tokenConnection(h);
  const before = await rows();
  await writeFile(path.join(dir, 'valid.txt'), 'whsec-valid-0123456789');
  for (const key of secrets) {
    for (const text of ['', ' \n\t', undefined]) {
      const file = `${key}-${text === undefined ? 'missing' : text === '' ? 'empty' : 'blank'}.txt`;
      if (text !== undefined) await writeFile(path.join(dir, file), text);
      for (const action of ['create', 'update'] as const) {
        mutate.mockClear();
        const args =
          action === 'create'
            ? ['--kind', 'token', '--name', 'New']
            : [key === 'token' ? token.id : app.id, '--name', 'Changed'];
        await expect(
          cli(action, [
            ...args,
            '--client-id',
            'other-field',
            ...(key === 'webhookSecret'
              ? ['--token-file', 'valid.txt']
              : ['--webhook-secret-file', 'valid.txt']),
            `--${flagOf(key)}-file`,
            file,
          ]),
        ).rejects.toThrow(
          `--${flagOf(key)}-file: ${text === undefined ? 'cannot read ' : ''}${file}`,
        );
        expect(mutate).not.toHaveBeenCalled();
        expect(await rows()).toEqual(before);
      }
    }
  }
});

it('rejects blank credentials sent directly to the API before changing any field', async () => {
  const app = await appConnection();
  const token = await tokenConnection(h);
  const before = await rows();
  for (const key of secrets)
    for (const text of ['', ' \t\n']) {
      const response = await mutate({
        method: 'PATCH',
        path: `/git/connections/${key === 'token' ? token.id : app.id}`,
        fields: { name: 'Changed', [key]: text },
      });
      expect(response.status).toBe(400);
      expect(await response.text()).toContain(
        `${key} must not be empty or whitespace-only`,
      );
      expect(await rows()).toEqual(before);
      const created = await mutate({
        method: 'POST',
        path: '/git/connections',
        fields: { kind: 'token', name: 'New', [key]: text },
      });
      expect(created.status).toBe(400);
      expect(await rows()).toEqual(before);
    }
});

it('allows explicit null only without an assignment, preserves omitted credentials, and invalidates cached tokens', async () => {
  const app = await appConnection();
  await h.gitConnections.connectionAuth({
    connectionId: app.id,
    apiBaseUrl: API,
  });
  const before = await rows();
  await writeFile(path.join(dir, 'value.txt'), 'sensitive-value-do-not-echo');
  for (const key of secrets) {
    await writeFile(
      path.join(dir, 'clear.json'),
      JSON.stringify({ [key]: null }),
    );
    for (const assignment of [
      [`--${flagOf(key)}`, 'sensitive-value-do-not-echo'],
      [`--${flagOf(key)}-file`, 'value.txt'],
    ]) {
      mutate.mockClear();
      const error = await cli('update', [
        app.id,
        '--file',
        'clear.json',
        ...assignment,
      ]).catch((e) => e as Error);
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toContain(`Cannot clear ${key}`);
      expect((error as Error).message).not.toContain(
        'sensitive-value-do-not-echo',
      );
      expect(mutate).not.toHaveBeenCalled();
      expect(await rows()).toEqual(before);
    }
  }
  const renamed = await cli('update', [app.id, '--name', 'Renamed']);
  expect(renamed.status).toBe(200);
  const kept = (await rows())[0]!;
  for (const key of secrets)
    expect(kept[`${key}Sealed`]).toEqual(before[0]![`${key}Sealed`]);
  await writeFile(
    path.join(dir, 'clear.json'),
    JSON.stringify({
      privateKey: null,
      clientSecret: null,
      webhookSecret: null,
    }),
  );
  const cleared = await cli('update', [
    app.id,
    '--file',
    'clear.json',
    '--name',
    'Cleared',
  ]);
  expect(cleared.status).toBe(200);
  expect(await cleared.json()).toMatchObject({ data: { state: 'incomplete' } });
  const after = (await rows())[0]!;
  expect(after.name).toBe('Cleared');
  for (const key of [
    'privateKeySealed',
    'clientSecretSealed',
    'webhookSecretSealed',
  ])
    expect(after[key]).toBeNull();
  expect(
    await h.projects.tx
      .read()
      .query.selectFrom(INSTALLATION_TOKENS)
      .selectAll()
      .execute(),
  ).toEqual([]);
  const token = await tokenConnection(h);
  const savedToken = (await rows()).find(
    (row) => row.id === token.id,
  )!.tokenSealed;
  expect(
    (await cli('update', [token.id, '--name', 'Renamed token'])).status,
  ).toBe(200);
  expect(
    (await rows()).find((row) => row.id === token.id)!.tokenSealed,
  ).toEqual(savedToken);
  await writeFile(
    path.join(dir, 'clear.json'),
    JSON.stringify({ token: null }),
  );
  const clearedToken = await cli('update', [token.id, '--file', 'clear.json']);
  expect(clearedToken.status).toBe(200);
  expect(await clearedToken.json()).toMatchObject({
    data: { state: 'incomplete', hasToken: false },
  });
  expect(
    (await rows()).find((row) => row.id === token.id)!.tokenSealed,
  ).toBeNull();
});

it('accepts nonempty files for all four credentials on create and update through the published CLI manifest', async () => {
  h.github.app.installations.set('acme', '77');
  const contents = {
    privateKey: h.github.app.privateKey,
    clientSecret: h.github.app.clientSecret,
    token: 'ghp-file-token',
    webhookSecret: 'whsec-file-0123456789',
  };
  const flags: string[] = [];
  for (const key of secrets) {
    const file = `${key}.txt`;
    await writeFile(path.join(dir, file), contents[key]);
    flags.push(`--${flagOf(key)}-file`, file);
  }
  const created = await cli('create', [
    '--kind',
    'app',
    '--name',
    'File app',
    '--app-id',
    h.github.app.appId,
    '--client-id',
    h.github.app.clientId,
    '--account',
    'acme',
    ...flags,
  ]);
  expect(created.status).toBe(201);
  const connection = ((await created.json()) as { data: { id: string } }).data;
  const updated = await cli('update', [
    connection.id,
    '--name',
    'Updated file app',
    ...flags,
  ]);
  expect(updated.status).toBe(200);
  const row = (await rows())[0]!;
  expect(row.name).toBe('Updated file app');
  for (const key of secrets) {
    expect(row[`${key}Sealed`]).toBeTruthy();
    expect(row[`${key}Sealed`]).not.toContain(contents[key]);
  }
  const auth = await h.gitConnections.connectionAuth({
    connectionId: connection.id,
    apiBaseUrl: API,
  });
  expect(auth.auth.token).toBeTruthy();
  for (const action of ['create', 'update']) {
    const command = commands.find((c) => c.id === `git:connection:${action}`)!;
    for (const key of secrets)
      expect(command.parameters.find((p) => p.field === key)).toMatchObject({
        contentFile: true,
        contentFileNonEmpty: true,
      });
  }
});
