/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  BrowserPreviewSession,
  buildWorkspaceDelta,
  isBrowserProvisionalPreviewEnabled,
  resolveBrowserPreviewWasmUrl,
  resolveBrowserPreviewWorkerUrl,
  type BrowserPreviewWorkerFactory,
} from '../browser-preview/BrowserPreviewSession';
import {
  isBrowserPreviewWorkerResponse,
  LIGHT_EXTENSION_BROWSER_PREVIEW_COMPILER_BUILD_ID,
  LIGHT_EXTENSION_BROWSER_PREVIEW_PROTOCOL_VERSION,
  type BrowserPreviewWorkerRequest,
  type BrowserPreviewWorkerResponse,
  type ProvisionalCompileResult,
} from '../browser-preview/protocol';
import {
  PROVISIONAL_PREVIEW_SANDBOX_SOURCE,
  ProvisionalPreviewSandbox,
} from '../browser-preview/ProvisionalPreviewSandbox';
import { useBrowserProvisionalPreview } from '../browser-preview/useBrowserProvisionalPreview';
import { BrowserPreviewVirtualFileSystem } from '../browser-preview/virtualFileSystem';

type MessageListener = (event: MessageEvent<BrowserPreviewWorkerResponse>) => void;
type ErrorListener = (event: ErrorEvent) => void;

class InMemoryPreviewWorker {
  readonly requests: BrowserPreviewWorkerRequest[] = [];
  readonly messageListeners: MessageListener[] = [];
  readonly errorListeners: ErrorListener[] = [];
  holdBuilds = false;
  crashOnBuild = false;
  terminated = false;

  addEventListener(type: 'error' | 'message', listener: ErrorListener | MessageListener): void {
    if (type === 'error') {
      this.errorListeners.push(listener as ErrorListener);
    } else {
      this.messageListeners.push(listener as MessageListener);
    }
  }

  postMessage(request: BrowserPreviewWorkerRequest): void {
    if (this.terminated) {
      return;
    }
    this.requests.push(request);
    if (request.type === 'build' && this.crashOnBuild) {
      this.crashOnBuild = false;
      this.emitError('simulated provisional preview crash');
      return;
    }
    if (request.type === 'build' && this.holdBuilds) {
      return;
    }
    queueMicrotask(() => this.respond(request));
  }

  terminate(): void {
    this.terminated = true;
  }

  emitBuild(request: Extract<BrowserPreviewWorkerRequest, { type: 'build' }>): void {
    this.emit({
      protocolVersion: LIGHT_EXTENSION_BROWSER_PREVIEW_PROTOCOL_VERSION,
      requestId: request.requestId,
      type: 'buildResult',
      workspaceVersion: request.workspaceVersion,
      result: provisionalResult(request.entry.entryPath),
    });
  }

  private respond(request: BrowserPreviewWorkerRequest): void {
    switch (request.type) {
      case 'initialize':
        this.emit({
          protocolVersion: LIGHT_EXTENSION_BROWSER_PREVIEW_PROTOCOL_VERSION,
          requestId: request.requestId,
          type: 'ready',
          initializationMs: 2,
          metrics: { wasmDownloadMs: 1, wasmInitializeMs: 1 },
        });
        return;
      case 'replaceWorkspace':
      case 'applyDelta':
        this.emit({
          protocolVersion: LIGHT_EXTENSION_BROWSER_PREVIEW_PROTOCOL_VERSION,
          requestId: request.requestId,
          type: 'workspaceUpdated',
          workspaceVersion: request.workspaceVersion,
        });
        return;
      case 'build':
        this.emitBuild(request);
        return;
      case 'cancel':
        this.emit({
          protocolVersion: LIGHT_EXTENSION_BROWSER_PREVIEW_PROTOCOL_VERSION,
          requestId: request.requestId,
          type: 'cancelled',
          targetRequestId: request.targetRequestId,
        });
        return;
      case 'dispose':
        this.emit({
          protocolVersion: LIGHT_EXTENSION_BROWSER_PREVIEW_PROTOCOL_VERSION,
          requestId: request.requestId,
          type: 'disposed',
        });
    }
  }

  private emit(response: BrowserPreviewWorkerResponse): void {
    for (const listener of this.messageListeners) {
      listener({ data: response } as MessageEvent<BrowserPreviewWorkerResponse>);
    }
  }

  private emitError(message: string): void {
    for (const listener of this.errorListeners) {
      listener({ message } as ErrorEvent);
    }
  }
}

function provisionalResult(entryPath: string): ProvisionalCompileResult {
  return {
    provisional: true,
    snapshotId: 'browser-preview-snapshot',
    requestId: 'browser-preview-request',
    accepted: true,
    artifact: {
      code: 'globalThis.__nocobaseProvisionalPreviewRun__ = async () => undefined;',
      version: 'v2',
      entryPath,
      metadata: {
        provisional: true,
        trust: 'client-advisory',
        compilerBuildId: LIGHT_EXTENSION_BROWSER_PREVIEW_COMPILER_BUILD_ID,
      },
    },
    problems: [],
    metrics: {
      workerRestartCount: 0,
      inputFileCount: 1,
      inputBytes: 10,
      estimatedMemoryBytes: 20,
    },
  };
}

function entry() {
  return {
    entryPath: 'src/client/js-blocks/example/index.tsx',
    kind: 'js-block' as const,
    runtimeVersion: 'v2',
    surfaceStyle: 'render' as const,
  };
}

function file(content = 'ctx.render(<div />);') {
  return [{ path: entry().entryPath, content, language: 'typescript' }];
}

afterEach(() => {
  const globals = globalThis as typeof globalThis & {
    __NOCOBASE_LIGHT_EXTENSION_BROWSER_PREVIEW__?: boolean;
    __NOCOBASE_LIGHT_EXTENSION_PREVIEW_WORKER_URL__?: string;
    __NOCOBASE_LIGHT_EXTENSION_PREVIEW_WASM_URL__?: string;
  };
  delete globals.__NOCOBASE_LIGHT_EXTENSION_BROWSER_PREVIEW__;
  delete globals.__NOCOBASE_LIGHT_EXTENSION_PREVIEW_WORKER_URL__;
  delete globals.__NOCOBASE_LIGHT_EXTENSION_PREVIEW_WASM_URL__;
  vi.unstubAllGlobals();
});

describe('esbuild-wasm provisional compiler capability spike', () => {
  it.each([
    {
      name: 'HTTP 404',
      fetchCompiler: vi.fn(async () => new Response('missing', { status: 404 })),
    },
    {
      name: 'network, CORS, or CSP rejection',
      fetchCompiler: vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    },
  ])('reports a stable fetch problem for $name', async ({ fetchCompiler }) => {
    const { BrowserProvisionalCompiler } = await loadBrowserCompiler();
    vi.stubGlobal('fetch', fetchCompiler);
    const compiler = new BrowserProvisionalCompiler();

    await expect(compiler.initialize('/assets/esbuild.wasm')).rejects.toMatchObject({
      code: 'PREVIEW_WASM_FETCH_FAILED',
      recoverable: true,
    });
  });

  it('reports a stable problem code for a wrong WASM MIME type', async () => {
    const { BrowserProvisionalCompiler } = await loadBrowserCompiler();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('not wasm', { status: 200, headers: { 'content-type': 'text/html' } })),
    );
    const compiler = new BrowserProvisionalCompiler();

    await expect(compiler.initialize('/assets/esbuild.wasm')).rejects.toMatchObject({
      code: 'PREVIEW_WASM_MIME_INVALID',
      recoverable: true,
    });
  });

  it.each([
    { name: 'missing content type', headers: {} },
    { name: 'generic binary content type', headers: { 'content-type': 'application/octet-stream' } },
  ])('accepts $name before validating the WASM bytes', async ({ headers }) => {
    const { BrowserProvisionalCompiler } = await loadBrowserCompiler();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(new ArrayBuffer(1), { status: 200, headers })),
    );
    const compiler = new BrowserProvisionalCompiler();

    await expect(compiler.initialize('/assets/esbuild.wasm')).rejects.toMatchObject({
      code: 'PREVIEW_WASM_COMPILE_FAILED',
      recoverable: true,
    });
  });

  it('initializes once and produces bundle, source map, problems, and metafile from the browser VFS', async () => {
    const { BrowserProvisionalCompiler } = await loadBrowserCompiler();
    const { readFile } = await import('node:fs/promises');
    const wasm = await readFile(`${process.cwd()}/node_modules/esbuild-wasm/esbuild.wasm`);
    const fetchCompiler = vi.fn(
      async () => new Response(wasm, { status: 200, headers: { 'content-type': 'application/wasm' } }),
    );
    vi.stubGlobal('fetch', fetchCompiler);
    const compiler = new BrowserProvisionalCompiler();
    const vfs = new BrowserPreviewVirtualFileSystem();
    vfs.replace(1, [
      {
        path: entry().entryPath,
        content: "import { label } from './label'; ctx.render(<div>{label}</div>);",
        language: 'typescript',
      },
      {
        path: 'src/client/js-blocks/example/label.ts',
        content: 'export const label = "browser preview";',
        language: 'typescript',
      },
    ]);

    const firstInitialization = await compiler.initialize('/assets/esbuild.wasm');
    const secondInitialization = await compiler.initialize('/assets/esbuild.wasm');
    const result = await compiler.build(vfs, entry(), 0, 'build:test', 'browser-preview:1');

    expect(fetchCompiler).toHaveBeenCalledTimes(1);
    expect(secondInitialization).toEqual(firstInitialization);
    expect(result).toMatchObject({
      provisional: true,
      accepted: true,
      artifact: {
        code: expect.stringContaining('__nocobaseProvisionalPreviewRun__'),
        sourceMap: expect.any(String),
        metadata: {
          provisional: true,
          trust: 'client-advisory',
          canonical: false,
        },
      },
      problems: [],
      metafile: expect.any(Object),
      metrics: {
        firstBuildMs: expect.any(Number),
        inputFileCount: 2,
      },
    });
    compiler.dispose();
  });
});

async function loadBrowserCompiler() {
  const { TextDecoder, TextEncoder } = await import('node:util');
  vi.stubGlobal('TextEncoder', TextEncoder);
  vi.stubGlobal('TextDecoder', TextDecoder);
  vi.stubGlobal('Uint8Array', new TextEncoder().encode('').constructor);
  return import('../browser-preview/browserProvisionalCompiler');
}

describe('browser provisional preview protocol and VFS', () => {
  it('keeps requests JSON serializable and deployment URLs overrideable for root and sub-path assets', () => {
    const globals = globalThis as typeof globalThis & {
      __NOCOBASE_LIGHT_EXTENSION_PREVIEW_WORKER_URL__?: string;
      __NOCOBASE_LIGHT_EXTENSION_PREVIEW_WASM_URL__?: string;
    };
    const request: BrowserPreviewWorkerRequest = {
      type: 'build',
      protocolVersion: LIGHT_EXTENSION_BROWSER_PREVIEW_PROTOCOL_VERSION,
      requestId: 'build-1',
      workspaceVersion: 3,
      entry: entry(),
    };

    expect(JSON.parse(JSON.stringify(request))).toEqual(request);
    globals.__NOCOBASE_LIGHT_EXTENSION_PREVIEW_WORKER_URL__ = '/assets/preview-worker.js';
    globals.__NOCOBASE_LIGHT_EXTENSION_PREVIEW_WASM_URL__ = '/assets/esbuild.wasm';
    expect(resolveBrowserPreviewWorkerUrl()).toBe('/assets/preview-worker.js');
    expect(resolveBrowserPreviewWasmUrl()).toContain('/assets/esbuild.wasm');
    globals.__NOCOBASE_LIGHT_EXTENSION_PREVIEW_WORKER_URL__ = '/nocobase/v/assets/preview-worker.js';
    globals.__NOCOBASE_LIGHT_EXTENSION_PREVIEW_WASM_URL__ = '/nocobase/v/assets/esbuild.wasm';
    expect(resolveBrowserPreviewWorkerUrl()).toBe('/nocobase/v/assets/preview-worker.js');
    expect(resolveBrowserPreviewWasmUrl()).toContain('/nocobase/v/assets/esbuild.wasm');
  });

  it('uses bundler-resolved URLs by default and rejects mismatched protocol responses', () => {
    const workerURL = resolveBrowserPreviewWorkerUrl();
    const wasmURL = resolveBrowserPreviewWasmUrl();

    expect(workerURL).toBeInstanceOf(URL);
    expect(String(workerURL)).toContain('browserPreview.worker.ts');
    expect(wasmURL).toContain('.wasm');
    expect(wasmURL).not.toBe('/esbuild.wasm');
    expect(
      isBrowserPreviewWorkerResponse({
        protocolVersion: LIGHT_EXTENSION_BROWSER_PREVIEW_PROTOCOL_VERSION + 1,
        requestId: 'initialize-1',
        type: 'ready',
      }),
    ).toBe(false);
  });

  it('applies create, update, delete, and rename deltas without replacing the workspace', () => {
    const vfs = new BrowserPreviewVirtualFileSystem();
    vfs.replace(1, [
      { path: 'src/entry/index.ts', content: 'export const value = 1;' },
      { path: 'src/shared.ts', content: 'export const shared = true;' },
    ]);
    vfs.applyDelta(2, [
      { operation: 'rename', path: 'src/shared.ts', nextPath: 'src/shared-renamed.ts' },
      { operation: 'upsert', file: { path: 'src/entry/index.ts', content: 'export const value = 2;' } },
      { operation: 'upsert', file: { path: 'src/new.ts', content: 'export const next = true;' } },
    ]);
    vfs.applyDelta(3, [{ operation: 'delete', path: 'src/new.ts' }]);

    expect(vfs.version).toBe(3);
    expect(vfs.get('src/entry/index.ts')?.content).toContain('value = 2');
    expect(vfs.has('src/shared.ts')).toBe(false);
    expect(vfs.has('src/shared-renamed.ts')).toBe(true);
    expect(vfs.has('src/new.ts')).toBe(false);
    expect(vfs.stats()).toEqual(expect.objectContaining({ fileCount: 2, inputBytes: expect.any(Number) }));
  });

  it('detects renames separately from ordinary upserts and deletes', () => {
    expect(
      buildWorkspaceDelta(
        [
          { path: 'src/old.ts', content: 'same' },
          { path: 'src/update.ts', content: 'before' },
          { path: 'src/delete.ts', content: 'gone' },
        ],
        [
          { path: 'src/new.ts', content: 'same' },
          { path: 'src/update.ts', content: 'after' },
        ],
      ),
    ).toEqual([
      { operation: 'delete', path: 'src/delete.ts' },
      { operation: 'rename', path: 'src/old.ts', nextPath: 'src/new.ts' },
      { operation: 'upsert', file: { path: 'src/update.ts', content: 'after', language: undefined } },
    ]);
  });
});

describe('ProvisionalPreviewSandbox security contract', () => {
  it('uses an opaque-origin script-only iframe with restrictive CSP and revokes bundle URLs', async () => {
    const sandbox = new ProvisionalPreviewSandbox();
    const execution = sandbox.execute('globalThis.__nocobaseProvisionalPreviewRun__ = async () => undefined;', 0);
    const iframe = document.querySelector('iframe');

    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('sandbox')).toBe('allow-scripts');
    expect(iframe?.getAttribute('sandbox')).not.toContain('allow-same-origin');
    expect(PROVISIONAL_PREVIEW_SANDBOX_SOURCE).toContain("connect-src 'none'");
    expect(PROVISIONAL_PREVIEW_SANDBOX_SOURCE).not.toContain('unsafe-eval');
    expect(PROVISIONAL_PREVIEW_SANDBOX_SOURCE.match(/URL\.revokeObjectURL\(bundleURL\)/gu)).toHaveLength(2);
    iframe?.dispatchEvent(new Event('load'));
    await expect(execution).resolves.toMatchObject({ accepted: false });
    sandbox.dispose();
    expect(document.querySelector('iframe')).toBeNull();
  });
});

describe('BrowserPreviewSession', () => {
  it('sends one full snapshot and only deltas for later edits', async () => {
    const worker = new InMemoryPreviewWorker();
    const session = new BrowserPreviewSession(() => worker, '/assets/esbuild.wasm', 0);

    await session.syncWorkspace(file('first'));
    await session.syncWorkspace(file('second'));

    const syncRequests = worker.requests.filter(
      (request) => request.type === 'replaceWorkspace' || request.type === 'applyDelta',
    );
    expect(syncRequests[0]).toEqual(expect.objectContaining({ type: 'replaceWorkspace', workspaceVersion: 1 }));
    expect(syncRequests[1]).toEqual(
      expect.objectContaining({
        type: 'applyDelta',
        workspaceVersion: 2,
        changes: [
          {
            operation: 'upsert',
            file: expect.objectContaining({ content: 'second', path: entry().entryPath }),
          },
        ],
      }),
    );
    session.dispose();
  });

  it('drops stale build results after a newer workspace version is synchronized', async () => {
    const worker = new InMemoryPreviewWorker();
    const session = new BrowserPreviewSession(() => worker, '/assets/esbuild.wasm', 0);
    await session.syncWorkspace(file('first'));
    worker.holdBuilds = true;

    const stale = session.build(entry());
    await vi.waitFor(() => expect(worker.requests.filter((request) => request.type === 'build')).toHaveLength(1));
    await session.syncWorkspace(file('second'));
    const current = session.build(entry());
    await vi.waitFor(() => expect(worker.requests.filter((request) => request.type === 'build')).toHaveLength(2));
    const builds = worker.requests.filter(
      (request): request is Extract<BrowserPreviewWorkerRequest, { type: 'build' }> => request.type === 'build',
    );
    worker.emitBuild(builds[1]);
    await expect(current).resolves.toEqual(expect.objectContaining({ provisional: true }));
    worker.emitBuild(builds[0]);
    await expect(stale).resolves.toBeNull();
    session.dispose();
  });

  it('sends logical cancellation without rendering the cancelled build result', async () => {
    const worker = new InMemoryPreviewWorker();
    const session = new BrowserPreviewSession(() => worker, '/assets/esbuild.wasm', 0);
    await session.syncWorkspace(file());
    worker.holdBuilds = true;
    const pending = session.build(entry());
    await vi.waitFor(() => expect(worker.requests.filter((request) => request.type === 'build')).toHaveLength(1));

    await session.cancelLatestBuild();
    const buildRequest = worker.requests.find(
      (request): request is Extract<BrowserPreviewWorkerRequest, { type: 'build' }> => request.type === 'build',
    );
    expect(worker.requests).toContainEqual(
      expect.objectContaining({ type: 'cancel', targetRequestId: buildRequest?.requestId }),
    );
    if (buildRequest) {
      worker.emitBuild(buildRequest);
    }
    await expect(pending).resolves.toBeNull();
    session.dispose();
  });

  it('restarts at most once after a worker crash and replays the current full workspace', async () => {
    const workers: InMemoryPreviewWorker[] = [];
    const factory: BrowserPreviewWorkerFactory = () => {
      const worker = new InMemoryPreviewWorker();
      if (workers.length === 0) {
        worker.crashOnBuild = true;
      }
      workers.push(worker);
      return worker;
    };
    const session = new BrowserPreviewSession(factory, '/assets/esbuild.wasm', 0);
    await session.syncWorkspace(file());

    await expect(session.build(entry())).resolves.toEqual(
      expect.objectContaining({ metrics: expect.objectContaining({ workerRestartCount: 1 }) }),
    );
    expect(workers).toHaveLength(2);
    expect(workers[1].requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'initialize' }),
        expect.objectContaining({ type: 'replaceWorkspace', workspaceVersion: 1, files: file() }),
        expect.objectContaining({ type: 'build', workspaceVersion: 1 }),
      ]),
    );
    session.dispose();
  });

  it('is disabled by default and requires an explicit rollout flag', () => {
    const globals = globalThis as typeof globalThis & { __NOCOBASE_LIGHT_EXTENSION_BROWSER_PREVIEW__?: boolean };
    expect(isBrowserProvisionalPreviewEnabled()).toBe(false);
    globals.__NOCOBASE_LIGHT_EXTENSION_BROWSER_PREVIEW__ = true;
    expect(isBrowserProvisionalPreviewEnabled()).toBe(true);
  });
});

describe('useBrowserProvisionalPreview', () => {
  it('exposes ready provisional UI state and rebuilds edited files through VFS deltas', async () => {
    const worker = new InMemoryPreviewWorker();
    const session = new BrowserPreviewSession(() => worker, '/assets/esbuild.wasm', 0);
    const sandbox = new (class extends ProvisionalPreviewSandbox {
      async execute() {
        return { accepted: true };
      }

      dispose() {}
    })();
    const sessionFactory = () => session;
    const sandboxFactory = () => sandbox;
    const initialProps = {
      enabled: true,
      files: file('first'),
      entry: entry(),
      debounceMs: 0,
      sessionFactory,
      sandboxFactory,
      workspaceSnapshotId: 'workspace-first',
    };
    const { result, rerender, unmount } = renderHook((props) => useBrowserProvisionalPreview(props), {
      initialProps,
    });

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.result?.artifact.metadata).toEqual(
      expect.objectContaining({ provisional: true, trust: 'client-advisory' }),
    );

    rerender({ ...initialProps, files: file('second'), workspaceSnapshotId: 'workspace-second' });
    await waitFor(() =>
      expect(
        worker.requests.some(
          (request) =>
            request.type === 'applyDelta' &&
            request.changes.some((change) => change.operation === 'upsert' && change.file.content === 'second'),
        ),
      ).toBe(true),
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.workspaceSnapshotId).toBe('workspace-second');
    unmount();
  });
});
