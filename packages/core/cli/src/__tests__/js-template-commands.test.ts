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
  extractPullResult,
  extractTemplateRecord,
  JS_TEMPLATE_BASELINE_PATH,
  JS_TEMPLATE_EXIT_CODES,
  JS_TEMPLATE_STATE_PATH,
  type JsTemplateKind,
  type JsTemplateWorkspaceFile,
  type JsTemplateWorkspaceState,
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

interface JsTemplateKindFixture {
  kind: JsTemplateKind;
  root: string;
  entryFileName: 'index.ts' | 'index.tsx';
  title: string;
  tag: string;
  source: string;
}

const JS_TEMPLATE_KIND_FIXTURES: readonly JsTemplateKindFixture[] = [
  {
    kind: 'js-block',
    root: 'src/client/js-blocks/demo',
    entryFileName: 'index.tsx',
    title: 'Demo block',
    tag: 'JS Block',
    source: 'ctx.render(<div>{ctx.t("你好")}</div>);\n',
  },
  {
    kind: 'js-action',
    root: 'src/client/js-actions/demo',
    entryFileName: 'index.ts',
    title: 'Demo action',
    tag: 'JS Action',
    source: 'ctx.message.success(ctx.t("Demo action"));\n',
  },
];
const VALID_JS_TEMPLATE_LIFECYCLE_STATUSES: Array<'enabled' | 'disabled'> = ['enabled', 'disabled'];
const INVALID_JS_TEMPLATE_LIFECYCLE_STATUS_CASES: Array<[string, Record<string, unknown>]> = [
  ['archived', { lifecycleStatus: 'archived' }],
  ['an arbitrary string', { lifecycleStatus: 'pending' }],
  ['an empty string', { lifecycleStatus: '' }],
  ['null', { lifecycleStatus: null }],
  ['a missing value', {}],
];

function getKindFixture(kind: JsTemplateKind): JsTemplateKindFixture {
  const fixture = JS_TEMPLATE_KIND_FIXTURES.find((candidate) => candidate.kind === kind);
  if (!fixture) throw new Error(`Missing fixture for ${kind}`);
  return fixture;
}

function getEntryPath(fixture: JsTemplateKindFixture): string {
  return `${fixture.root}/${fixture.entryFileName}`;
}

function getDescriptorPath(fixture: JsTemplateKindFixture): string {
  return `${fixture.root}/entry.json`;
}

function getDescriptorMetadata(fixture: JsTemplateKindFixture): Record<string, unknown> {
  return {
    schemaVersion: 1,
    key: 'demo',
    title: fixture.title,
    category: fixture.kind,
    tags: [fixture.tag],
  };
}

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

function templateEnvelope(kind: JsTemplateKind = 'js-block') {
  const fixture = getKindFixture(kind);
  return {
    data: {
      id: 'jtt_demo',
      projectId: 'jtp_demo',
      target: 'client',
      kind,
      templateName: 'demo',
      entryPath: getEntryPath(fixture),
      descriptorPath: getDescriptorPath(fixture),
    },
  };
}

function pullEnvelope(
  headCommitId: string | null = null,
  files?: Array<Record<string, unknown>>,
  kind: JsTemplateKind = 'js-block',
) {
  const fixture = getKindFixture(kind);
  const descriptorContent = `${JSON.stringify(getDescriptorMetadata(fixture), null, 2)}\n`;
  return {
    data: {
      project: { id: 'jtp_demo', name: 'demo', lifecycleStatus: 'enabled', headCommitId },
      commit: headCommitId ? { id: headCommitId, treeHash: 'tree_base' } : null,
      tree: { hash: 'tree_base', entryCount: 2, byteSize: 120 },
      unchanged: false,
      files: files || [
        {
          path: getDescriptorPath(fixture),
          content: descriptorContent,
          encoding: 'utf8',
          language: 'json',
          mode: '100644',
          blobHash: `descriptor-${kind}`,
          size: Buffer.byteLength(descriptorContent, 'utf8'),
        },
        {
          path: getEntryPath(fixture),
          content: fixture.source,
          encoding: 'utf8',
          language: 'typescript',
          mode: '100644',
          blobHash: `source-${kind}`,
          size: Buffer.byteLength(fixture.source, 'utf8'),
        },
      ],
    },
  };
}

function pullResultWithProjectFields(projectFields: Record<string, unknown>): Record<string, unknown> {
  return {
    project: { id: 'jtp_demo', name: 'demo', headCommitId: null, ...projectFields },
    commit: null,
    tree: null,
    unchanged: false,
    files: [],
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

async function runPull(workspace: string, headCommitId: string | null = null, kind: JsTemplateKind = 'js-block') {
  fakeHandlers['/api/jsTemplates:get'] = () => ({ body: templateEnvelope(kind) });
  fakeHandlers['/api/jsTemplateFiles:pull'] = () => ({ body: pullEnvelope(headCommitId, undefined, kind) });
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

async function runAcceptedCheck(workspace: string, kind: JsTemplateKind = 'js-block') {
  const fixture = getKindFixture(kind);
  const entryPath = getEntryPath(fixture);
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
            kind,
            templateName: 'demo',
            entryPath,
            status: 'success',
            accepted: true,
            diagnostics: [],
            artifact: {
              runtimeVersion: 'v2',
              entryPath,
              filesHash: `files-${kind}`,
              metadata: {
                projectId: 'jtp_demo',
                templateId: 'jtt_demo',
                kind,
                templateName: 'demo',
              },
            },
          },
        ],
      },
    },
  });
  const command = createCommandHarness(commandFlags(workspace), JS_TEMPLATE_WORKSPACE_API_PATHS);
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

  test.each(['js-block', 'js-page', 'js-field', 'js-action', 'js-item'] as const)(
    'accepts the public %s kind',
    (kind) => {
      expect(
        extractTemplateRecord({
          id: 'jtt_demo',
          projectId: 'jtp_demo',
          target: 'client',
          kind,
          templateName: 'demo',
          entryPath: 'src/client/index.tsx',
          descriptorPath: 'src/client/entry.json',
        }).kind,
      ).toBe(kind);
    },
  );

  test.each(VALID_JS_TEMPLATE_LIFECYCLE_STATUSES)('accepts the %s project lifecycle status', (lifecycleStatus) => {
    const result = extractPullResult(pullResultWithProjectFields({ lifecycleStatus }));

    expect(result.project.lifecycleStatus).toBe(lifecycleStatus);
  });

  test.each(INVALID_JS_TEMPLATE_LIFECYCLE_STATUS_CASES)(
    'rejects %s as a project lifecycle status',
    (_label, projectFields) => {
      expect(() => extractPullResult(pullResultWithProjectFields(projectFields))).toThrow(
        'Pull project lifecycleStatus is missing or invalid.',
      );
    },
  );

  test.each([['js-block'], ['js-action']] as const)('pulls a supported %s workspace', async (kind) => {
    const workspace = await createTempWorkspace();
    const fixture = getKindFixture(kind);
    await runPull(workspace, null, kind);

    const state = JSON.parse(
      await readFile(join(workspace, ...JS_TEMPLATE_STATE_PATH.split('/')), 'utf8'),
    ) as JsTemplateWorkspaceState;
    expect(state.template).toEqual({
      id: 'jtt_demo',
      kind,
      name: 'demo',
      path: getEntryPath(fixture),
      descriptorPath: getDescriptorPath(fixture),
    });
    expect(JSON.parse(await readFile(join(workspace, ...getDescriptorPath(fixture).split('/')), 'utf8'))).toEqual(
      getDescriptorMetadata(fixture),
    );
    expect(await readFile(join(workspace, ...getEntryPath(fixture).split('/')), 'utf8')).toBe(fixture.source);
  });

  test('uses the canonical JS Template HTTP resources', async () => {
    const workspace = await createTempWorkspace();
    await runPull(workspace);
    await writeFile(join(workspace, 'src/client/js-blocks/demo/index.tsx'), 'export default "canonical";\n', 'utf8');
    await runAcceptedCheck(workspace);
    fakeHandlers['/api/jsTemplateFiles:saveSource'] = () => ({
      body: {
        data: {
          project: { id: 'jtp_demo', name: 'demo', lifecycleStatus: 'enabled', headCommitId: 'commit_canonical' },
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

    expect(await readFile(join(workspace, 'src/client/js-blocks/demo/index.tsx'), 'utf8')).toContain('你好');
    const stateText = await readFile(join(workspace, ...JS_TEMPLATE_STATE_PATH.split('/')), 'utf8');
    expect(stateText).not.toMatch(/secret-api-key|authorization|cookie/i);
    expect(requests[0]?.headers.authorization).toBe('Bearer secret-api-key');
    expect(requests[0]?.headers['x-role']).toBe('developer');

    await writeFile(
      join(workspace, 'src/client/js-blocks/demo/index.tsx'),
      'ctx.render(<div>{ctx.t("你好，Agent")}</div>);\n',
      'utf8',
    );
    await runAcceptedCheck(workspace);
    const checkRequest = requests.find((request) => request.path.endsWith('compileWorkspacePreview'));
    expect(checkRequest?.body.expectedHeadCommitId).toBeNull();
    expect((checkRequest?.body.files as JsTemplateWorkspaceFile[]).map((file) => file.path)).toEqual([
      'src/client/js-blocks/demo/entry.json',
      'src/client/js-blocks/demo/index.tsx',
    ]);

    fakeHandlers['/api/jsTemplateFiles:saveSource'] = () => ({
      body: {
        data: {
          project: { id: 'jtp_demo', name: 'demo', lifecycleStatus: 'enabled', headCommitId: 'commit_new' },
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
      expect.objectContaining({ path: 'src/client/js-blocks/demo/index.tsx', operation: 'upsert' }),
    ]);
  });

  test('pulls, checks, and saves a js-action workspace with authoritative metadata', async () => {
    const workspace = await createTempWorkspace();
    const fixture = getKindFixture('js-action');
    const entryPath = getEntryPath(fixture);
    const descriptorPath = getDescriptorPath(fixture);
    const modifiedSource = 'ctx.message.success(ctx.t("Action saved by Agent"));\n';
    await runPull(workspace, 'commit_action_base', 'js-action');

    expect(await readFile(join(workspace, ...entryPath.split('/')), 'utf8')).toBe(fixture.source);
    await writeFile(join(workspace, ...entryPath.split('/')), modifiedSource, 'utf8');

    const checkCommand = await runAcceptedCheck(workspace, 'js-action');
    const checkRequest = requests.find((request) => request.path.endsWith('compileWorkspacePreview'));
    expect(checkRequest?.body).toEqual({
      projectId: 'jtp_demo',
      expectedHeadCommitId: 'commit_action_base',
      files: expect.any(Array),
    });
    const checkedFiles = checkRequest?.body.files as JsTemplateWorkspaceFile[];
    expect(checkedFiles.map((file) => file.path)).toEqual([descriptorPath, entryPath]);
    expect(checkedFiles.find((file) => file.path === entryPath)?.content).toBe(modifiedSource);
    expect(JSON.parse(checkedFiles.find((file) => file.path === descriptorPath)?.content || '{}')).toEqual(
      getDescriptorMetadata(fixture),
    );

    const checkOutput = JSON.parse(String(checkCommand.log.mock.calls.at(-1)?.[0])) as {
      check: { templates: Array<Record<string, unknown>> };
    };
    expect(checkOutput.check.templates).toEqual([
      expect.objectContaining({
        templateId: 'jtt_demo',
        projectId: 'jtp_demo',
        target: 'client',
        kind: 'js-action',
        templateName: 'demo',
        entryPath,
        status: 'success',
        accepted: true,
      }),
    ]);

    const artifactSummary = {
      runtimeVersion: 'v2',
      entryPath,
      filesHash: 'files-js-action-saved',
      metadata: {
        projectId: 'jtp_demo',
        templateId: 'jtt_demo',
        kind: 'js-action',
        templateName: 'demo',
        modelUse: 'JSActionModel',
        surface: 'js-model.action',
        surfaceStyle: 'action',
      },
    };
    fakeHandlers['/api/jsTemplateFiles:saveSource'] = () => ({
      body: {
        data: {
          project: {
            id: 'jtp_demo',
            name: 'demo',
            lifecycleStatus: 'enabled',
            headCommitId: 'commit_action_new',
          },
          commit: { id: 'commit_action_new', treeHash: 'tree_action_new' },
          tree: { hash: 'tree_action_new', entryCount: 2, byteSize: 180 },
          compile: {
            status: 'success',
            templates: [
              {
                templateId: 'jtt_demo',
                templateName: 'demo',
                kind: 'js-action',
                entryPath,
                status: 'success',
                execution: 'compiled',
                diagnostics: [],
                artifact: artifactSummary,
              },
            ],
          },
          diagnostics: [],
        },
      },
    });
    const saveCommand = createCommandHarness({
      ...commandFlags(workspace),
      message: 'Update demo action',
      yes: true,
    });
    await JsTemplateSave.prototype.run.call(saveCommand as never);

    const saveRequest = requests.find((request) => request.path.endsWith('saveSource'));
    expect(saveRequest?.body).toEqual({
      projectId: 'jtp_demo',
      expectedHeadCommitId: 'commit_action_base',
      message: 'Update demo action',
      files: [
        {
          path: entryPath,
          operation: 'upsert',
          content: modifiedSource,
          encoding: 'utf8',
          size: Buffer.byteLength(modifiedSource, 'utf8'),
          language: 'typescript',
          mode: '100644',
        },
      ],
    });
    const reviewOutput = JSON.parse(String(saveCommand.logToStderr.mock.calls.at(0)?.[0])) as {
      stage: string;
      review: {
        baseHeadCommitId: string | null;
        delta: Record<string, number>;
        diff: string;
      };
    };
    expect(reviewOutput).toMatchObject({
      stage: 'review',
      review: {
        baseHeadCommitId: 'commit_action_base',
        delta: { changedFiles: 1, upserts: 1, deletes: 0, additions: 1, deletions: 1 },
      },
    });
    expect(reviewOutput.review.diff).toContain(`--- a/${entryPath}`);
    expect(reviewOutput.review.diff).toContain(`-${fixture.source.trim()}`);
    expect(reviewOutput.review.diff).toContain(`+${modifiedSource.trim()}`);

    const saveOutput = JSON.parse(String(saveCommand.log.mock.calls.at(-1)?.[0])) as {
      newHeadCommitId: string;
      delta: Record<string, number>;
      result: {
        compile: { status: string; templates: Array<Record<string, unknown>> };
      };
    };
    expect(saveOutput.newHeadCommitId).toBe('commit_action_new');
    expect(saveOutput.delta).toEqual({ changedFiles: 1, upserts: 1, deletes: 0, additions: 1, deletions: 1 });
    expect(saveOutput.result.compile).toEqual({
      status: 'success',
      templates: [
        expect.objectContaining({
          templateId: 'jtt_demo',
          kind: 'js-action',
          entryPath,
          status: 'success',
          execution: 'compiled',
          artifact: artifactSummary,
        }),
      ],
    });
    expect(JSON.stringify(saveOutput.result.compile)).not.toContain('"code"');

    const state = JSON.parse(
      await readFile(join(workspace, ...JS_TEMPLATE_STATE_PATH.split('/')), 'utf8'),
    ) as JsTemplateWorkspaceState;
    expect(state.baseHeadCommitId).toBe('commit_action_new');
    expect(state.lastCheck).toBeUndefined();
    expect(await readFile(join(workspace, ...entryPath.split('/')), 'utf8')).toBe(modifiedSource);
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
              path: 'src/client/js-blocks/demo/index.tsx',
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
    await writeFile(join(workspace, 'src/client/js-blocks/demo/index.tsx'), 'export default 2;\n', 'utf8');
    await runAcceptedCheck(workspace);
    const baselinePath = join(
      workspace,
      ...JS_TEMPLATE_BASELINE_PATH.split('/'),
      'src/client/js-blocks/demo/index.tsx',
    );
    const baselineBefore = await readFile(baselinePath, 'utf8');
    fakeHandlers['/api/jsTemplateFiles:saveSource'] = () => ({
      status: 409,
      body: { errors: [{ message: 'Head changed' }] },
    });
    const command = createCommandHarness({ ...commandFlags(workspace), message: 'Update', yes: true });
    await expect(JsTemplateSave.prototype.run.call(command as never)).rejects.toMatchObject({
      exitCode: JS_TEMPLATE_EXIT_CODES.conflict,
    });
    expect(await readFile(join(workspace, 'src/client/js-blocks/demo/index.tsx'), 'utf8')).toBe('export default 2;\n');
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
    await writeFile(join(workspace, 'src/client/js-blocks/demo/index.tsx'), 'export default 2;\n', 'utf8');
    await runAcceptedCheck(workspace);
    await writeFile(
      join(workspace, ...JS_TEMPLATE_BASELINE_PATH.split('/'), 'src/client/js-blocks/demo/index.tsx'),
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
          path: 'src/client/js-blocks/demo/index.tsx',
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
    await writeFile(join(workspace, 'src/client/js-blocks/demo/index.tsx'), Buffer.from([0, 1, 2]));
    const command = createCommandHarness(commandFlags(workspace));
    await expect(JsTemplateCheck.prototype.run.call(command as never)).rejects.toMatchObject({ exitCode: 1 });
    expect(requests.some((request) => request.path.endsWith('compileWorkspacePreview'))).toBe(false);
  });
});
