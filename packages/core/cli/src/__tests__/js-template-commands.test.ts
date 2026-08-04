/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import JsTemplateCheck from '../commands/js-template/check.js';
import JsTemplatePull from '../commands/js-template/pull.js';
import JsTemplateSave from '../commands/js-template/save.js';
import {
  JS_TEMPLATE_BASELINE_PATH,
  JS_TEMPLATE_EXIT_CODES,
  JS_TEMPLATE_STATE_PATH,
  type JsTemplateWorkspaceFile,
} from '../lib/js-template-workspace.js';
import {
  JS_TEMPLATE_WORKSPACE_API_PATHS,
  type JsTemplateWorkspaceApiPaths,
} from '../lib/js-template-command-contract.js';

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

function createCommandHarness(
  flags: Record<string, unknown>,
  apiPaths: JsTemplateWorkspaceApiPaths = JS_TEMPLATE_WORKSPACE_API_PATHS,
) {
  return {
    apiPaths,
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
    const recorded = { path, headers: request.headers, body: await readJsonBody(request) };
    requests.push(recorded);
    const result = fakeHandlers[path]
      ? await fakeHandlers[path](recorded)
      : { status: 404, body: { errors: [{ message: 'not found' }] } };
    response.statusCode = result.status ?? 200;
    response.setHeader('content-type', 'application/json');
    response.end(JSON.stringify(result.body));
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Fake runtime did not bind a TCP port');
  apiBaseUrl = `http://127.0.0.1:${address.port}/api`;
  closeServer = () =>
    new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

function templateEnvelope() {
  return {
    data: {
      id: 'jtt_demo',
      projectId: 'jtp_demo',
      target: 'client',
      kind: 'js-block',
      templateName: 'demo',
      entryPath: 'src/client/demo/index.tsx',
      descriptorPath: 'src/client/demo/entry.json',
    },
  };
}

function pullEnvelope(headCommitId: string | null = null, files?: Array<Record<string, unknown>>) {
  return {
    data: {
      project: { id: 'jtp_demo', name: 'demo', lifecycleStatus: 'active', headCommitId },
      commit: headCommitId ? { id: headCommitId, treeHash: 'tree_base' } : null,
      tree: { hash: 'tree_base', entryCount: 2, byteSize: 120 },
      unchanged: false,
      files: files || [
        {
          path: 'src/client/demo/entry.json',
          content: '{"schemaVersion":1,"kind":"js-block","name":"demo","template":"index.tsx"}\n',
          encoding: 'utf8',
          language: 'json',
          mode: '100644',
          blobHash: 'descriptor',
          size: 80,
        },
        {
          path: 'src/client/demo/index.tsx',
          content: 'export default function Demo() {\n  return "你好";\n}\n',
          encoding: 'utf8',
          language: 'typescript',
          mode: '100644',
          blobHash: 'source',
          size: 58,
        },
      ],
    },
  };
}

async function createTempWorkspace(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'nocobase-js-template-cli-'));
  temporaryDirectories.push(directory);
  return join(directory, 'workspace');
}

function commandFlags(workspace: string) {
  return {
    dir: workspace,
    env: 'test',
    'api-base-url': apiBaseUrl,
    role: 'developer',
    authenticator: 'password',
    token: 'secret-api-key',
    'json-output': true,
  };
}

async function runPull(
  workspace: string,
  headCommitId: string | null = null,
) {
  fakeHandlers['/api/jsTemplates:get'] = () => ({ body: templateEnvelope() });
  fakeHandlers['/api/jsTemplateFiles:pull'] = () => ({ body: pullEnvelope(headCommitId) });
  const command = createCommandHarness(
    {
      ...commandFlags(workspace),
      project: 'jtp_demo',
      template: 'jtt_demo',
    },
    JS_TEMPLATE_WORKSPACE_API_PATHS,
  );
  await JsTemplatePull.prototype.run.call(command as never);
  return command;
}

async function runAcceptedCheck(workspace: string) {
  fakeHandlers['/api/jsTemplates:compileWorkspacePreview'] = () => ({
    body: {
      data: {
        accepted: true,
        httpStatus: 200,
        diagnostics: [],
        templates: [
          {
            templateId: 'jtt_demo',
            projectId: 'jtp_demo',
            target: 'client',
            kind: 'js-block',
            templateName: 'demo',
            entryPath: 'src/client/demo/index.tsx',
            status: 'success',
            accepted: true,
            diagnostics: [],
          },
        ],
      },
    },
  });
  const command = createCommandHarness(
    commandFlags(workspace),
    JS_TEMPLATE_WORKSPACE_API_PATHS,
  );
  await JsTemplateCheck.prototype.run.call(command as never);
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

describe('nb js-template pull/check/save', () => {
  test('keeps command copy synchronized in English and Simplified Chinese', async () => {
    const enUS = await readFile(join(process.cwd(), 'packages/core/cli/src/locale/en-US.json'), 'utf8');
    const zhCN = await readFile(join(process.cwd(), 'packages/core/cli/src/locale/zh-CN.json'), 'utf8');

    expect(enUS).toContain('JS Template workspace');
    expect(zhCN).toContain('JS 模板 Workspace');
    expect(JsTemplateCheck.summary).toContain('JS Template');
    expect(JsTemplateSave.summary).toContain('JS Template');
  });

  test('uses the canonical JS Template HTTP resources', async () => {
    const workspace = await createTempWorkspace();
    await runPull(workspace);
    await writeFile(join(workspace, 'src/client/demo/index.tsx'), 'export default "canonical";\n', 'utf8');
    await runAcceptedCheck(workspace);
    fakeHandlers['/api/jsTemplateFiles:saveSource'] = () => ({
      body: {
        data: {
          project: { id: 'jtp_demo', name: 'demo', lifecycleStatus: 'active', headCommitId: 'commit_canonical' },
          commit: { id: 'commit_canonical', treeHash: 'tree_canonical' },
          tree: { hash: 'tree_canonical', entryCount: 2, byteSize: 130 },
          compile: { status: 'success', templates: [] },
          diagnostics: [],
        },
      },
    });
    const saveCommand = createCommandHarness(
      {
        ...commandFlags(workspace),
        message: 'Update canonical workspace',
        yes: true,
      },
      JS_TEMPLATE_WORKSPACE_API_PATHS,
    );
    await JsTemplateSave.prototype.run.call(saveCommand as never);

    expect(requests.map((request) => request.path)).toEqual([
      '/api/jsTemplates:get',
      '/api/jsTemplateFiles:pull',
      '/api/jsTemplates:compileWorkspacePreview',
      '/api/jsTemplateFiles:saveSource',
    ]);
    expect(JSON.parse(String(saveCommand.log.mock.calls.at(-1)?.[0]))).toEqual(
      expect.objectContaining({ ok: true, newHeadCommitId: 'commit_canonical' }),
    );
  });

  test('pulls, checks, and saves a UTF-8 delta without persisting credentials', async () => {
    const workspace = await createTempWorkspace();
    await runPull(workspace);

    expect(await readFile(join(workspace, 'src/client/demo/index.tsx'), 'utf8')).toContain('return "你好";');
    const stateText = await readFile(join(workspace, ...JS_TEMPLATE_STATE_PATH.split('/')), 'utf8');
    expect(stateText).not.toMatch(/secret-api-key|authorization|cookie/i);
    expect(requests[0]?.headers.authorization).toBe('Bearer secret-api-key');
    expect(requests[0]?.headers['x-role']).toBe('developer');

    await writeFile(
      join(workspace, 'src/client/demo/index.tsx'),
      'export default function Demo() {\n  return "你好，Agent";\n}\n',
      'utf8',
    );
    await runAcceptedCheck(workspace);
    const checkRequest = requests.find((request) => request.path.endsWith('compileWorkspacePreview'));
    expect(checkRequest?.body.expectedHeadCommitId).toBeNull();
    expect((checkRequest?.body.files as JsTemplateWorkspaceFile[]).map((file) => file.path)).toEqual([
      'src/client/demo/entry.json',
      'src/client/demo/index.tsx',
    ]);

    fakeHandlers['/api/jsTemplateFiles:saveSource'] = () => ({
      body: {
        data: {
          project: { id: 'jtp_demo', name: 'demo', lifecycleStatus: 'active', headCommitId: 'commit_new' },
          commit: { id: 'commit_new', treeHash: 'tree_new' },
          tree: { hash: 'tree_new', entryCount: 2, byteSize: 130 },
          compile: { status: 'success', templates: [] },
          diagnostics: [],
        },
      },
    });
    const saveCommand = createCommandHarness({
      ...commandFlags(workspace),
      message: 'Update demo',
      yes: true,
    });
    await JsTemplateSave.prototype.run.call(saveCommand as never);
    const saveRequest = requests.find((request) => request.path.endsWith('saveSource'));
    expect(saveRequest?.body.expectedHeadCommitId).toBeNull();
    expect(saveRequest?.body.files).toEqual([
      expect.objectContaining({ path: 'src/client/demo/index.tsx', operation: 'upsert' }),
    ]);
  });

  test('returns diagnostics from a rejected check with the stable exit code', async () => {
      const workspace = await createTempWorkspace();
      await runPull(workspace);
      fakeHandlers['/api/jsTemplates:compileWorkspacePreview'] = () => ({
        status: 422,
        body: {
          data: {
            accepted: false,
            httpStatus: 422,
            diagnostics: [
              {
                code: 'typescript_error',
                severity: 'error',
                message: 'Cannot find name missingValue',
                path: 'src/client/demo/index.tsx',
                line: 2,
                column: 10,
              },
            ],
          },
        },
      });
      const command = createCommandHarness(commandFlags(workspace));
      await expect(JsTemplateCheck.prototype.run.call(command as never)).rejects.toMatchObject({
        exitCode: JS_TEMPLATE_EXIT_CODES.rejected,
      });
      const failure = JSON.parse(String(command.logToStderr.mock.calls.at(-1)?.[0]));
      expect(failure.exitCode).toBe(JS_TEMPLATE_EXIT_CODES.rejected);
      expect(failure.check.diagnostics[0].line).toBe(2);
  });

  test('keeps local files and baseline unchanged after a stale-Head save conflict', async () => {
    const workspace = await createTempWorkspace();
    await runPull(workspace, 'commit_base');
    await writeFile(join(workspace, 'src/client/demo/index.tsx'), 'export default 2;\n', 'utf8');
    await runAcceptedCheck(workspace);
    const baselinePath = join(workspace, ...JS_TEMPLATE_BASELINE_PATH.split('/'), 'src/client/demo/index.tsx');
    const baselineBefore = await readFile(baselinePath, 'utf8');
    fakeHandlers['/api/jsTemplateFiles:saveSource'] = () => ({
      status: 409,
      body: { errors: [{ message: 'Head changed' }] },
    });
    const command = createCommandHarness({ ...commandFlags(workspace), message: 'Update', yes: true });
    await expect(JsTemplateSave.prototype.run.call(command as never)).rejects.toMatchObject({
      exitCode: JS_TEMPLATE_EXIT_CODES.conflict,
    });
    expect(await readFile(join(workspace, 'src/client/demo/index.tsx'), 'utf8')).toBe('export default 2;\n');
    expect(await readFile(baselinePath, 'utf8')).toBe(baselineBefore);
  });

  test('refuses to pull over local changes', async () => {
    const workspace = await createTempWorkspace();
    await mkdir(workspace, { recursive: true });
    await writeFile(join(workspace, 'local.ts'), 'keep me\n', 'utf8');
    const command = createCommandHarness({
      ...commandFlags(workspace),
      project: 'jtp_demo',
      template: 'jtt_demo',
    });
    await expect(JsTemplatePull.prototype.run.call(command as never)).rejects.toMatchObject({ exitCode: 1 });
    expect(requests).toHaveLength(0);
    expect(await readFile(join(workspace, 'local.ts'), 'utf8')).toBe('keep me\n');
  });

  test.each(['.nocobase', '.js-template/types', 'node_modules', 'src'])(
    'rejects the workspace when %s is a symbolic link',
    async (linkPath) => {
      const workspace = await createTempWorkspace();
      const outside = join(workspace, '..', 'outside');
      const linkSegments = linkPath.split('/');
      await mkdir(join(workspace, ...linkSegments.slice(0, -1)), { recursive: true });
      await mkdir(outside, { recursive: true });
      await writeFile(join(outside, 'sentinel.txt'), 'keep me\n', 'utf8');
      await symlink(outside, join(workspace, ...linkSegments), 'dir');

      await expect(runPull(workspace)).rejects.toMatchObject({ exitCode: 1 });

      expect(requests).toHaveLength(0);
      expect(await readFile(join(outside, 'sentinel.txt'), 'utf8')).toBe('keep me\n');
    },
  );

  test('rejects a modified Pull baseline before saving', async () => {
    const workspace = await createTempWorkspace();
    await runPull(workspace);
    await writeFile(join(workspace, 'src/client/demo/index.tsx'), 'export default 2;\n', 'utf8');
    await runAcceptedCheck(workspace);
    await writeFile(
      join(workspace, ...JS_TEMPLATE_BASELINE_PATH.split('/'), 'src/client/demo/index.tsx'),
      'tampered\n',
      'utf8',
    );
    const command = createCommandHarness({ ...commandFlags(workspace), message: 'Update', yes: true });
    await expect(JsTemplateSave.prototype.run.call(command as never)).rejects.toMatchObject({ exitCode: 1 });
    expect(requests.some((request) => request.path.endsWith('saveSource'))).toBe(false);
  });

  test('rejects an unexpected base64 pull response before writing the workspace', async () => {
    const workspace = await createTempWorkspace();
    fakeHandlers['/api/jsTemplates:get'] = () => ({ body: templateEnvelope() });
    fakeHandlers['/api/jsTemplateFiles:pull'] = () => ({
      body: pullEnvelope(null, [
        {
          path: 'src/client/demo/index.tsx',
          content: Buffer.from('export default 1;\n').toString('base64'),
          encoding: 'base64',
          language: 'typescript',
          mode: '100644',
          blobHash: 'source',
          size: 18,
        },
      ]),
    });
    const command = createCommandHarness({
      ...commandFlags(workspace),
      project: 'jtp_demo',
      template: 'jtt_demo',
    });
    await expect(JsTemplatePull.prototype.run.call(command as never)).rejects.toMatchObject({ exitCode: 1 });
  });

  test('rejects local NUL content before calling the check endpoint', async () => {
    const workspace = await createTempWorkspace();
    await runPull(workspace);
    await writeFile(join(workspace, 'src/client/demo/index.tsx'), Buffer.from([0, 1, 2]));
    const command = createCommandHarness(commandFlags(workspace));
    await expect(JsTemplateCheck.prototype.run.call(command as never)).rejects.toMatchObject({ exitCode: 1 });
    expect(requests.some((request) => request.path.endsWith('compileWorkspacePreview'))).toBe(false);
  });
});
