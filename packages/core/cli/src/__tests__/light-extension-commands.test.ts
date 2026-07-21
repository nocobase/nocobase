/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import LightCheck from '../commands/light/check.js';
import LightPull from '../commands/light/pull.js';
import LightSave from '../commands/light/save.js';
import {
  buildWorkspaceSnapshotId,
  LIGHT_EXTENSION_EXIT_CODES,
  LIGHT_EXTENSION_STATE_PATH,
  loadWorkspaceState,
  readWorkspaceFiles,
  type LightExtensionWorkspaceFile,
} from '../lib/light-extension-workspace.js';

interface RecordedRequest {
  path: string;
  headers: IncomingMessage['headers'];
  body: Record<string, unknown>;
}

interface FakeResponse {
  status?: number;
  body: unknown;
}

type FakeHandler = (request: RecordedRequest) => FakeResponse | Promise<FakeResponse>;

const temporaryDirectories: string[] = [];
let fakeHandlers: Record<string, FakeHandler>;
let requests: RecordedRequest[];
let apiBaseUrl: string;
let closeServer: (() => Promise<void>) | undefined;

class CommandExit extends Error {
  constructor(readonly exitCode: number) {
    super(`exit ${exitCode}`);
  }
}

function createCommandHarness(flags: Record<string, unknown>) {
  return {
    parse: vi.fn(async () => ({ args: {}, flags })),
    log: vi.fn(),
    logToStderr: vi.fn(),
    exit: (exitCode: number) => {
      throw new CommandExit(exitCode);
    },
  };
}

async function readJsonBody(request: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  const content = Buffer.concat(chunks).toString('utf8');
  return content ? (JSON.parse(content) as Record<string, unknown>) : {};
}

async function startFakeRuntime(): Promise<void> {
  const server = createServer(async (request: IncomingMessage, response: ServerResponse) => {
    const path = new URL(request.url || '/', 'http://127.0.0.1').pathname;
    const recorded: RecordedRequest = {
      path,
      headers: request.headers,
      body: await readJsonBody(request),
    };
    requests.push(recorded);
    const handler = fakeHandlers[path];
    const result = handler ? await handler(recorded) : { status: 404, body: { errors: [{ message: 'not found' }] } };
    response.statusCode = result.status ?? 200;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(result.body));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Fake runtime did not bind a TCP port');
  apiBaseUrl = `http://127.0.0.1:${address.port}/api`;
  closeServer = () =>
    new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
}

function entryEnvelope() {
  return {
    data: {
      id: 'lee_demo',
      repoId: 'ler_demo',
      target: 'client',
      kind: 'js-block',
      entryName: 'demo',
      entryPath: 'src/client/demo/index.tsx',
      descriptorPath: 'src/client/demo/entry.json',
    },
  };
}

function pullEnvelope(expectedHeadCommitId: string | null = null) {
  const descriptor = '{"schemaVersion":1,"kind":"js-block","name":"demo","entry":"index.tsx"}\n';
  const source = 'export default function Demo() {\n  return "你好";\n}\n';
  return {
    data: {
      repo: {
        id: 'ler_demo',
        name: 'demo',
        lifecycleStatus: 'active',
        headCommitId: expectedHeadCommitId,
      },
      commit: expectedHeadCommitId ? { id: expectedHeadCommitId, treeHash: 'tree_1' } : null,
      tree: { hash: 'tree_1', entryCount: 2, byteSize: Buffer.byteLength(descriptor + source) },
      unchanged: false,
      files: [
        {
          path: 'src/client/demo/entry.json',
          blobHash: 'descriptor_hash',
          size: Buffer.byteLength(descriptor),
          language: 'json',
          mode: '100644',
          content: descriptor,
          encoding: 'utf8',
        },
        {
          path: 'src/client/demo/index.tsx',
          blobHash: 'source_hash',
          size: Buffer.byteLength(source),
          language: 'typescript',
          mode: '100644',
          content: source,
          encoding: 'utf8',
        },
      ],
    },
  };
}

function contextPackEnvelope(options: { precise?: boolean } = {}) {
  const precise = options.precise === true;
  return {
    data: {
      contextPackVersion: 'light-extension.context-pack.v1',
      contextMode: precise ? 'precise' : 'generic',
      reason: precise ? 'precise_binding' : 'binding_not_selected',
      repoId: 'ler_demo',
      entry: {
        id: 'lee_demo',
        kind: 'js-block',
        entryName: 'demo',
        entryPath: 'src/client/demo/index.tsx',
        settingsSchema: null,
      },
      references: [],
      ...(precise
        ? {
            binding: {
              referenceId: 'ref_orders',
              ownerLocatorHash: 'owner_orders',
              owner: {
                ownerKind: 'flowModel.step',
                modelUid: 'orders_block',
                modelUse: 'JSBlockModel',
                surface: 'js-model.render',
                dataSourceKey: 'main',
                collectionName: 'orders',
              },
            },
            collection: {
              dataSourceKey: 'main',
              name: 'orders',
              fields: [
                { name: 'title', type: 'string', nullable: true, readable: true, writable: true },
                { name: 'status', enum: ['draft', 'done'], nullable: false, readable: true, writable: false },
              ],
            },
          }
        : {}),
      supportedImports: [],
      versions: { sdk: '2.2.0-beta.15', validator: '1' },
      contextHash: precise ? 'context_orders' : 'context_generic',
    },
  };
}

async function createTempWorkspace(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'nocobase-light-cli-'));
  temporaryDirectories.push(directory);
  return join(directory, 'workspace');
}

async function runPull(
  workspace: string,
  options?: {
    force?: boolean;
    head?: string | null;
    ownerLocator?: Record<string, unknown>;
    precise?: boolean;
    reference?: string;
  },
) {
  fakeHandlers['/api/lightExtensionEntries:get'] = () => ({ body: entryEnvelope() });
  fakeHandlers['/api/lightExtensionFiles:pull'] = () => ({ body: pullEnvelope(options?.head ?? null) });
  fakeHandlers['/api/lightExtensionContexts:get'] = () => ({
    body: contextPackEnvelope({ precise: options?.precise }),
  });
  const command = createCommandHarness({
    repo: 'ler_demo',
    entry: 'lee_demo',
    dir: workspace,
    force: options?.force ?? false,
    reference: options?.reference,
    'owner-locator': options?.ownerLocator ? JSON.stringify(options.ownerLocator) : undefined,
    env: 'test',
    'api-base-url': apiBaseUrl,
    role: 'developer',
    authenticator: 'password',
    token: 'secret-api-key',
    'json-output': true,
  });
  await LightPull.prototype.run.call(command as never);
  return command;
}

async function runAcceptedCheck(workspace: string) {
  fakeHandlers['/api/lightExtensions:compileWorkspacePreview'] = (request) => {
    const files = request.body.files as LightExtensionWorkspaceFile[];
    const snapshotId = buildWorkspaceSnapshotId(files);
    return {
      body: {
        data: {
          baseHeadCommitId: request.body.expectedHeadCommitId,
          snapshotId,
          requestId: 'request_check',
          accepted: true,
          problems: [],
          entries: [
            {
              entryId: 'lee_demo',
              repoId: 'ler_demo',
              target: 'client',
              kind: 'js-block',
              entryName: 'demo',
              entryPath: 'src/client/demo/index.tsx',
              status: 'success',
              accepted: true,
              problems: [],
            },
          ],
        },
      },
    };
  };
  const command = createCommandHarness({
    dir: workspace,
    env: 'test',
    'api-base-url': apiBaseUrl,
    role: 'developer',
    authenticator: 'password',
    token: 'secret-api-key',
    'json-output': true,
  });
  await LightCheck.prototype.run.call(command as never);
  return command;
}

beforeEach(async () => {
  fakeHandlers = {};
  requests = [];
  await startFakeRuntime();
});

afterEach(async () => {
  await closeServer?.();
  closeServer = undefined;
  for (const directory of temporaryDirectories.splice(0)) await rm(directory, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('nb light pull/check/save', () => {
  test('preserves text, authentication semantics, expectedHeadCommitId null, full checks, and delta-only saves', async () => {
    const workspace = await createTempWorkspace();
    await runPull(workspace);

    expect(await readFile(join(workspace, 'src/client/demo/index.tsx'), 'utf8')).toContain('return "你好";\n');
    const stateText = await readFile(join(workspace, ...LIGHT_EXTENSION_STATE_PATH.split('/')), 'utf8');
    expect(stateText).not.toContain('secret-api-key');
    expect(stateText).not.toMatch(/authorization|cookie/i);
    expect((await loadWorkspaceState(workspace)).contextHash).toBe('context_generic');
    expect(await readFile(join(workspace, '.light-extension/types/context.d.ts'), 'utf8')).toContain(
      'JSBlockContext<TSettings, unknown, unknown, unknown, unknown, unknown>',
    );
    expect(requests[0]?.headers.authorization).toBe('Bearer secret-api-key');
    expect(requests[0]?.headers['x-role']).toBe('developer');
    expect(requests.slice(0, 3).every((request) => request.headers['x-authenticator'] === 'password')).toBe(true);

    await writeFile(
      join(workspace, 'src/client/demo/index.tsx'),
      'export default function Demo() {\n  return `你好，${"Agent"}`;\n}\n',
      'utf8',
    );
    await mkdir(join(workspace, '.light-extension/types'), { recursive: true });
    await writeFile(join(workspace, '.light-extension/types/context.d.ts'), Buffer.from([0, 1, 2]));
    await runAcceptedCheck(workspace);

    const checkRequest = requests.find((request) => request.path.endsWith('compileWorkspacePreview'));
    expect(checkRequest?.body.expectedHeadCommitId).toBeNull();
    expect(checkRequest?.headers['x-authenticator']).toBe('password');
    expect((checkRequest?.body.files as Array<{ path: string }>).map((file) => file.path)).toEqual([
      'src/client/demo/entry.json',
      'src/client/demo/index.tsx',
    ]);
    expect((checkRequest?.body.files as Array<{ content: string }>)[1]?.content).toContain('你好，${"Agent"}');

    fakeHandlers['/api/lightExtensionFiles:saveSource'] = (request) => ({
      body: {
        data: {
          repo: { id: 'ler_demo', name: 'demo', lifecycleStatus: 'active', headCommitId: 'commit_1' },
          commit: { id: 'commit_1', treeHash: 'tree_2' },
          tree: { hash: 'tree_2', entryCount: 2, byteSize: 200 },
          compile: { status: 'success', entries: [] },
          problems: [],
        },
      },
    });
    const saveCommand = createCommandHarness({
      dir: workspace,
      message: 'Save Unicode source',
      yes: true,
      env: 'test',
      'api-base-url': apiBaseUrl,
      role: 'developer',
      authenticator: 'password',
      token: 'secret-api-key',
      'json-output': true,
    });
    await LightSave.prototype.run.call(saveCommand as never);

    const saveRequest = requests.find((request) => request.path.endsWith('saveSource'));
    expect(saveRequest?.body.expectedHeadCommitId).toBeNull();
    expect(saveRequest?.body.message).toBe('Save Unicode source');
    expect(saveRequest?.headers['x-authenticator']).toBe('password');
    expect(saveRequest?.body.files).toEqual([
      expect.objectContaining({
        path: 'src/client/demo/index.tsx',
        operation: 'upsert',
        content: 'export default function Demo() {\n  return `你好，${"Agent"}`;\n}\n',
        encoding: 'utf8',
      }),
    ]);
    expect((await loadWorkspaceState(workspace)).baseHeadCommitId).toBe('commit_1');
    const reviewOutput = JSON.parse(String(saveCommand.logToStderr.mock.calls[0]?.[0])) as {
      stage: string;
      review: { diff: string; delta: { changedFiles: number } };
    };
    expect(reviewOutput).toMatchObject({ stage: 'review', review: { delta: { changedFiles: 1 } } });
    expect(reviewOutput.review.diff).toContain('+++ b/src/client/demo/index.tsx');
    const resultOutput = JSON.parse(String(saveCommand.log.mock.calls[0]?.[0])) as {
      review: { diff: string };
    };
    expect(resultOutput.review.diff).toBe(reviewOutput.review.diff);
  });

  test('requests an explicit binding and writes precise generated declarations outside source state', async () => {
    const workspace = await createTempWorkspace();
    await runPull(workspace, { precise: true, reference: 'ref_orders' });

    const contextRequest = requests.find((request) => request.path.endsWith('lightExtensionContexts:get'));
    expect(contextRequest?.body).toEqual({
      repoId: 'ler_demo',
      entryId: 'lee_demo',
      referenceId: 'ref_orders',
    });
    const collections = await readFile(join(workspace, '.light-extension/types/collections.d.ts'), 'utf8');
    expect(collections).toContain('title?: string | null;');
    expect(collections).toContain('status?: "done" | "draft";');
    const state = await loadWorkspaceState(workspace);
    expect(state.contextHash).toBe('context_orders');
    expect(Object.keys(state.files)).not.toContain('.light-extension/types/collections.d.ts');
    expect((await readWorkspaceFiles(workspace, state)).map((file) => file.path)).not.toContain(
      '.light-extension/types/collections.d.ts',
    );
  });

  test('uses only errors[0].details for HTTP 422 and exits with the stable rejection code', async () => {
    const workspace = await createTempWorkspace();
    await runPull(workspace, { head: 'commit_1' });
    const files = await readWorkspaceFiles(workspace, await loadWorkspaceState(workspace));
    const snapshotId = buildWorkspaceSnapshotId(files);
    fakeHandlers['/api/lightExtensions:compileWorkspacePreview'] = () => ({
      status: 422,
      body: {
        problems: [{ code: 'must-not-be-read' }],
        errors: [
          {
            code: 'LIGHT_EXTENSION_WORKSPACE_REJECTED',
            message: 'rejected',
            details: {
              baseHeadCommitId: 'commit_1',
              snapshotId,
              requestId: 'request_rejected',
              accepted: false,
              failureCode: 'LIGHT_EXTENSION_VALIDATION_FAILED',
              problems: [
                {
                  schemaVersion: 1,
                  phase: 'typecheck',
                  source: 'typescript',
                  severity: 'error',
                  code: 'ts_2322',
                  message: 'Type mismatch',
                  snapshotId,
                  requestId: 'request_rejected',
                  fingerprint: 'fingerprint_1',
                  path: 'src/client/demo/index.tsx',
                },
              ],
              entries: [
                {
                  entryId: 'lee_demo',
                  repoId: 'ler_demo',
                  target: 'client',
                  kind: 'js-block',
                  entryName: 'demo',
                  entryPath: 'src/client/demo/index.tsx',
                  status: 'success',
                  accepted: true,
                  problems: [],
                },
              ],
            },
          },
        ],
      },
    });
    const command = createCommandHarness({
      dir: workspace,
      env: 'test',
      'api-base-url': apiBaseUrl,
      role: undefined,
      token: 'secret-api-key',
      'json-output': true,
    });

    await expect(LightCheck.prototype.run.call(command as never)).rejects.toMatchObject({
      exitCode: LIGHT_EXTENSION_EXIT_CODES.rejected,
    });
    const output = JSON.parse(String(command.logToStderr.mock.calls[0]?.[0])) as Record<string, unknown>;
    expect((output.check as { problems: Array<{ code: string }> }).problems[0]?.code).toBe('ts_2322');
    expect(JSON.stringify(output)).not.toContain('must-not-be-read');
    expect((await loadWorkspaceState(workspace)).lastCheck).toBeUndefined();
  });

  test.each([
    [403, LIGHT_EXTENSION_EXIT_CODES.forbidden],
    [409, LIGHT_EXTENSION_EXIT_CODES.conflict],
  ])('returns stable machine-readable HTTP %i failures with exit code %i', async (status, exitCode) => {
    const workspace = await createTempWorkspace();
    await runPull(workspace, { head: 'commit_1' });
    fakeHandlers['/api/lightExtensions:compileWorkspacePreview'] = () => ({
      status,
      body: { errors: [{ code: status === 403 ? 'FORBIDDEN' : 'LIGHT_EXTENSION_SOURCE_OUTDATED', message: 'failed' }] },
    });
    const command = createCommandHarness({
      dir: workspace,
      env: 'test',
      'api-base-url': apiBaseUrl,
      role: undefined,
      token: 'secret-api-key',
      'json-output': true,
    });

    await expect(LightCheck.prototype.run.call(command as never)).rejects.toMatchObject({ exitCode });
    expect(JSON.parse(String(command.logToStderr.mock.calls[0]?.[0]))).toMatchObject({
      ok: false,
      httpStatus: status,
    });
  });

  test('keeps local files and baseline unchanged after a stale-Head save conflict', async () => {
    const workspace = await createTempWorkspace();
    await runPull(workspace, { head: 'commit_1' });
    const sourcePath = join(workspace, 'src/client/demo/index.tsx');
    await writeFile(sourcePath, 'export default () => "local patch";\n', 'utf8');
    await runAcceptedCheck(workspace);
    const stateBefore = await readFile(join(workspace, ...LIGHT_EXTENSION_STATE_PATH.split('/')), 'utf8');
    fakeHandlers['/api/lightExtensionFiles:saveSource'] = () => ({
      status: 409,
      body: {
        errors: [
          {
            code: 'LIGHT_EXTENSION_SOURCE_OUTDATED',
            message: 'Head changed',
            details: { expectedHeadCommitId: 'commit_1', currentHeadCommitId: 'commit_2' },
          },
        ],
      },
    });
    const command = createCommandHarness({
      dir: workspace,
      message: 'Save patch',
      yes: true,
      env: 'test',
      'api-base-url': apiBaseUrl,
      role: undefined,
      token: 'secret-api-key',
      'json-output': true,
    });

    await expect(LightSave.prototype.run.call(command as never)).rejects.toMatchObject({
      exitCode: LIGHT_EXTENSION_EXIT_CODES.conflict,
    });
    expect(await readFile(sourcePath, 'utf8')).toBe('export default () => "local patch";\n');
    expect(await readFile(join(workspace, ...LIGHT_EXTENSION_STATE_PATH.split('/')), 'utf8')).toBe(stateBefore);
    expect(String(command.logToStderr.mock.calls.at(-1)?.[0])).toContain('Pull the new Head and replay this patch');
  });

  test('refuses dirty pull targets unless --force creates a backup first', async () => {
    const workspace = await createTempWorkspace();
    await mkdir(workspace, { recursive: true });
    await writeFile(join(workspace, 'local.ts'), 'export const local = true;\n', 'utf8');
    const refused = createCommandHarness({
      repo: 'ler_demo',
      entry: 'lee_demo',
      dir: workspace,
      force: false,
      env: 'test',
      'api-base-url': apiBaseUrl,
      role: undefined,
      token: 'secret-api-key',
      'json-output': true,
    });
    await expect(LightPull.prototype.run.call(refused as never)).rejects.toMatchObject({ exitCode: 1 });
    expect(requests).toHaveLength(0);

    const forced = await runPull(workspace, { force: true });
    const output = JSON.parse(String(forced.log.mock.calls[0]?.[0])) as { backupPath: string };
    expect(await readFile(join(output.backupPath, 'local.ts'), 'utf8')).toBe('export const local = true;\n');
    expect(await readFile(join(workspace, 'src/client/demo/index.tsx'), 'utf8')).toContain('你好');
  });

  test('announces a forced-pull backup before removing source and returns it when materialization fails', async () => {
    const workspace = await createTempWorkspace();
    await mkdir(workspace, { recursive: true });
    const localPath = join(workspace, 'local.ts');
    await writeFile(localPath, 'export const local = true;\n', 'utf8');
    fakeHandlers['/api/lightExtensionEntries:get'] = () => ({ body: entryEnvelope() });
    fakeHandlers['/api/lightExtensionFiles:pull'] = () => ({
      body: {
        data: {
          ...pullEnvelope().data,
          files: pullEnvelope().data.files.filter((file) => !file.path.endsWith('/entry.json')),
        },
      },
    });
    fakeHandlers['/api/lightExtensionContexts:get'] = () => ({ body: contextPackEnvelope() });
    const command = createCommandHarness({
      repo: 'ler_demo',
      entry: 'lee_demo',
      dir: workspace,
      force: true,
      env: 'test',
      'api-base-url': apiBaseUrl,
      role: undefined,
      authenticator: 'password',
      token: 'secret-api-key',
      'json-output': true,
    });
    let sourceExistedWhenAnnounced = false;
    command.logToStderr.mockImplementationOnce(() => {
      sourceExistedWhenAnnounced = existsSync(localPath);
    });

    await expect(LightPull.prototype.run.call(command as never)).rejects.toMatchObject({ exitCode: 1 });

    expect(sourceExistedWhenAnnounced).toBe(true);
    const failure = JSON.parse(String(command.logToStderr.mock.calls.at(-1)?.[0])) as { backupPath: string };
    expect(await readFile(join(failure.backupPath, 'local.ts'), 'utf8')).toBe('export const local = true;\n');
  });

  test('rejects a modified Pull baseline before displaying or saving a reviewed Diff', async () => {
    const workspace = await createTempWorkspace();
    await runPull(workspace, { head: 'commit_1' });
    await writeFile(join(workspace, 'src/client/demo/index.tsx'), 'export default () => "local patch";\n', 'utf8');
    await runAcceptedCheck(workspace);
    await writeFile(
      join(workspace, '.nocobase/light-extension-baseline/src/client/demo/index.tsx'),
      'export default () => "tampered baseline";\n',
      'utf8',
    );
    requests = [];
    const command = createCommandHarness({
      dir: workspace,
      message: 'Save patch',
      yes: true,
      env: 'test',
      'api-base-url': apiBaseUrl,
      role: undefined,
      authenticator: 'password',
      token: 'secret-api-key',
      'json-output': true,
    });

    await expect(LightSave.prototype.run.call(command as never)).rejects.toMatchObject({ exitCode: 1 });

    expect(requests).toHaveLength(0);
    expect(command.log).not.toHaveBeenCalled();
    expect(command.logToStderr).toHaveBeenCalledTimes(1);
    expect(String(command.logToStderr.mock.calls[0]?.[0])).toContain('does not match the workspace state');
  });

  test.each([
    ['src/client/js-portals/demo/index.ts', 'utf8', 'export default 1;\n', /Portal/],
    ['src/client/demo/index.tsx', 'base64', 'AAEC', /Base64|binary/],
  ])('rejects unsupported pulled source %s before writing the workspace', async (path, encoding, content, message) => {
    const workspace = await createTempWorkspace();
    fakeHandlers['/api/lightExtensionEntries:get'] = () => ({ body: entryEnvelope() });
    fakeHandlers['/api/lightExtensionFiles:pull'] = () => ({
      body: {
        data: {
          ...pullEnvelope().data,
          files: [
            {
              path,
              blobHash: 'binary',
              size: Buffer.byteLength(content),
              language: 'text',
              mode: '100644',
              encoding,
              content,
            },
          ],
        },
      },
    });
    const command = createCommandHarness({
      repo: 'ler_demo',
      entry: 'lee_demo',
      dir: workspace,
      force: false,
      env: 'test',
      'api-base-url': apiBaseUrl,
      role: undefined,
      token: 'secret-api-key',
      'json-output': true,
    });

    await expect(LightPull.prototype.run.call(command as never)).rejects.toMatchObject({ exitCode: 1 });
    expect(String(command.logToStderr.mock.calls[0]?.[0])).toMatch(message);
    await expect(readFile(join(workspace, ...LIGHT_EXTENSION_STATE_PATH.split('/')), 'utf8')).rejects.toMatchObject({
      code: 'ENOENT',
    });
  });

  test('rejects local NUL and binary content before calling the check endpoint', async () => {
    const workspace = await createTempWorkspace();
    await runPull(workspace);
    requests = [];
    await writeFile(join(workspace, 'src/client/demo/index.tsx'), Buffer.from('export\0default 1;'));
    const command = createCommandHarness({
      dir: workspace,
      env: 'test',
      'api-base-url': apiBaseUrl,
      role: undefined,
      token: 'secret-api-key',
      'json-output': true,
    });

    await expect(LightCheck.prototype.run.call(command as never)).rejects.toMatchObject({ exitCode: 1 });
    expect(String(command.logToStderr.mock.calls[0]?.[0])).toMatch(/Binary|NUL|control/);
    expect(requests).toHaveLength(0);
  });
});
