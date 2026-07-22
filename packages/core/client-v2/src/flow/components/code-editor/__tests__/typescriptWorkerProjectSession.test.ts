/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { RUNJS_TYPESCRIPT_ENVIRONMENT_PACK_ID, type RunJSTypeLibraryPack } from '@nocobase/runjs/client-v2';
import { afterAll, afterEach, describe, expect, it, vi } from 'vitest';

import {
  createTypeScriptProjectSession as createProjectSession,
  type CodeEditorTypeScriptProject,
  type CodeEditorTypeScriptProjectSession,
} from '../typescriptProject';
import {
  clearRunJSTypeLibraryPackRegistryForTests,
  createRunJSTypeLibraryRegistry,
  registerRunJSTypeLibraryPackLoader,
} from '../typescriptLibraryRegistry';
import { SharedTypeScriptWorkerOwner } from '../sharedTypeScriptWorkerOwner';
import { TypeScriptWorkerRuntime } from '../typescriptWorkerRuntime';
import {
  RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION,
  type TypeScriptWorkerIncomingMessage,
  type TypeScriptWorkerLoadPackResponse,
  type TypeScriptWorkerOutgoingMessage,
  type TypeScriptWorkerRequest,
  type TypeScriptWorkerResponse,
} from '../typescriptWorkerProtocol';
import {
  resolveTypeScriptWorkerUrl,
  WorkerBackedTypeScriptProjectSession,
  type TypeScriptWorkerFactory,
} from '../typescriptWorkerProjectSession';
import { shutdownTypeScriptProjectSessionSuite } from './helpers/withTypeScriptProjectSession';

function fakePack(answer = 42): RunJSTypeLibraryPack {
  return {
    contentHash: `fake-${answer}`,
    dependencies: [],
    dependencyFiles: [
      {
        content: '{"name":"fake-lib","types":"index.d.ts"}',
        contentHash: 'package-json',
        path: '/node_modules/fake-lib/package.json',
      },
      {
        content: `export const answer: ${answer}; export function greet(name: string): string;`,
        contentHash: `index-${answer}`,
        path: '/node_modules/fake-lib/index.d.ts',
      },
    ],
    id: 'fake-lib',
    libraryName: 'fakeLib',
    rootFiles: [
      {
        content: "interface RunJSLibraries { fakeLib: typeof import('fake-lib') }",
        contentHash: 'bridge',
        path: '/__runjs__/fake-lib.d.ts',
      },
    ],
    version: '1.0.0',
  };
}

function deferred<T>() {
  let resolveDeferred!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    resolveDeferred = resolve;
  });
  return { promise, resolve: resolveDeferred };
}

const sessions = new Set<CodeEditorTypeScriptProjectSession>();
const owners = new Set<SharedTypeScriptWorkerOwner>();

function createTypeScriptProjectSession(
  options?: Parameters<typeof createProjectSession>[0],
): CodeEditorTypeScriptProjectSession {
  const session = createProjectSession(options);
  sessions.add(session);
  return session;
}

type MessageListener = (event: MessageEvent<TypeScriptWorkerOutgoingMessage>) => void;
type ErrorListener = (event: ErrorEvent) => void;

class InMemoryTypeScriptWorker {
  private readonly errorListeners: ErrorListener[] = [];
  private readonly messageListeners: MessageListener[] = [];
  private readonly packResolvers = new Map<
    number,
    { reject: (error: Error) => void; resolve: (pack: RunJSTypeLibraryPack) => void }
  >();
  private readonly runtime = new TypeScriptWorkerRuntime();
  private bridgeRequestId = 0;
  private terminated = false;
  terminateCount = 0;

  private crashedAfterPackRequest = false;

  constructor(
    private readonly crashOnFirstDiagnostics = false,
    private readonly crashAfterFirstPackRequest = false,
    private readonly crashOnFirstSync = false,
  ) {}

  addEventListener(type: 'error' | 'message', listener: ErrorListener | MessageListener): void {
    if (type === 'error') this.errorListeners.push(listener as ErrorListener);
    else this.messageListeners.push(listener as MessageListener);
  }

  emitError(message: string): void {
    for (const listener of this.errorListeners) listener({ message } as ErrorEvent);
  }

  postMessage(message: TypeScriptWorkerIncomingMessage): void {
    if (this.terminated) return;
    if (message.kind === 'load-pack-result') {
      this.resolvePack(message);
      return;
    }
    if (this.crashOnFirstSync && message.kind === 'sync') {
      this.terminated = true;
      this.emitError('simulated sync crash');
      return;
    }
    if (this.crashOnFirstDiagnostics && message.kind === 'diagnostics') {
      this.terminated = true;
      this.emitError('simulated crash');
      return;
    }
    this.handle(message);
  }

  terminate(): void {
    this.terminateCount += 1;
    this.terminated = true;
    this.runtime.disposeAll();
  }

  private emit(message: TypeScriptWorkerOutgoingMessage): void {
    for (const listener of this.messageListeners)
      listener({ data: message } as MessageEvent<TypeScriptWorkerOutgoingMessage>);
  }

  private loadPack(projectId: string, documentVersion: number) {
    return async (request: Parameters<Parameters<TypeScriptWorkerRuntime['sync']>[3]>[0]) => {
      const bridgeRequestId = ++this.bridgeRequestId;
      const promise = new Promise<RunJSTypeLibraryPack>((resolve, reject) => {
        this.packResolvers.set(bridgeRequestId, { reject, resolve });
      });
      this.emit({
        bridgeRequestId,
        documentVersion,
        kind: 'load-pack',
        projectId,
        protocolVersion: RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION,
        request,
      });
      if (
        this.crashAfterFirstPackRequest &&
        !this.crashedAfterPackRequest &&
        request.packId !== RUNJS_TYPESCRIPT_ENVIRONMENT_PACK_ID
      ) {
        this.crashedAfterPackRequest = true;
        this.terminated = true;
        this.emitError('simulated pack bridge crash');
      }
      return await promise;
    };
  }

  private resolvePack(message: TypeScriptWorkerLoadPackResponse): void {
    const pending = this.packResolvers.get(message.bridgeRequestId);
    if (!pending) return;
    this.packResolvers.delete(message.bridgeRequestId);
    if (message.error || !message.pack) pending.reject(new Error(message.error || 'missing pack'));
    else pending.resolve(message.pack);
  }

  private handle(request: TypeScriptWorkerRequest): void {
    const respond = (payload: { kind: string; result: unknown }) => {
      this.emit({
        ...payload,
        documentVersion: request.documentVersion,
        projectId: request.projectId,
        protocolVersion: RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION,
        requestId: request.requestId,
      } as TypeScriptWorkerResponse);
    };
    const fail = (error: unknown) => {
      this.emit({
        documentVersion: request.documentVersion,
        error: error instanceof Error ? error.message : String(error),
        kind: 'error',
        projectId: request.projectId,
        protocolVersion: RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION,
        requestId: request.requestId,
      });
    };
    Promise.resolve()
      .then(async () => {
        switch (request.kind) {
          case 'sync':
            if (request.snapshot) {
              this.runtime.sync(
                request.projectId,
                request.documentVersion,
                request.targetRevision,
                request.snapshot,
                this.loadPack(request.projectId, request.documentVersion),
              );
            } else if (request.update) {
              this.runtime.update(
                request.projectId,
                request.documentVersion,
                request.baseRevision as number,
                request.targetRevision,
                request.update,
                this.loadPack(request.projectId, request.documentVersion),
              );
            } else {
              throw new Error('missing worker project sync payload');
            }
            respond({ kind: 'synced', result: null });
            return;
          case 'completion':
            respond({
              kind: 'completion-result',
              result: await this.runtime.completion(request.projectId, request.documentVersion, request.position),
            });
            return;
          case 'diagnostics':
            respond({
              kind: 'diagnostics-result',
              result: await this.runtime.diagnostics(request.projectId, request.documentVersion),
            });
            return;
          case 'hover':
            respond({
              kind: 'hover-result',
              result: await this.runtime.hover(request.projectId, request.documentVersion, request.position),
            });
            return;
          case 'debug':
            respond({ kind: 'debug-result', result: this.runtime.debug(request.projectId) });
            return;
          case 'dispose':
            this.runtime.dispose(request.projectId);
            respond({ kind: 'disposed', result: null });
        }
      })
      .catch(fail);
  }
}

class ProtocolTestWorker {
  private readonly errorListeners: ErrorListener[] = [];
  private readonly messageListeners: MessageListener[] = [];
  private heldSyncResponses: TypeScriptWorkerResponse[] = [];
  holdSync = false;
  readonly messages: TypeScriptWorkerIncomingMessage[] = [];
  terminateCount = 0;

  constructor(private readonly responseProtocolVersion = RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION) {}

  addEventListener(type: 'error' | 'message', listener: ErrorListener | MessageListener): void {
    if (type === 'error') this.errorListeners.push(listener as ErrorListener);
    else this.messageListeners.push(listener as MessageListener);
  }

  postMessage(message: TypeScriptWorkerIncomingMessage): void {
    this.messages.push(message);
    if (message.kind === 'load-pack-result') return;
    const response = {
      documentVersion: message.documentVersion,
      projectId: message.projectId,
      protocolVersion: this.responseProtocolVersion,
      requestId: message.requestId,
      ...(message.kind === 'sync'
        ? { kind: 'synced', result: null }
        : message.kind === 'diagnostics'
          ? { kind: 'diagnostics-result', result: [] }
          : message.kind === 'debug'
            ? {
                kind: 'debug-result',
                result: {
                  actualLoadIds: [],
                  allFileNames: [],
                  cacheHitIds: [],
                  dependencyFileCount: 0,
                  disposed: false,
                  fileVersions: {},
                  immutableCacheCharacterCount: 0,
                  immutableFileCount: 0,
                  immutableSnapshotCreationCount: 0,
                  languageServiceCreationCount: 0,
                  packRequestIds: [],
                  peakDeclarationCharacterCount: 0,
                  programSourceFileCount: 0,
                  rootFileNames: [],
                },
              }
            : message.kind === 'completion'
              ? { kind: 'completion-result', result: null }
              : message.kind === 'hover'
                ? { kind: 'hover-result', result: null }
                : { kind: 'disposed', result: null }),
    } as TypeScriptWorkerResponse;
    if (message.kind === 'sync' && this.holdSync) {
      this.heldSyncResponses.push(response);
      return;
    }
    queueMicrotask(() => this.emit(response));
  }

  releaseNextSync(): void {
    const response = this.heldSyncResponses.shift();
    if (response) this.emit(response);
  }

  terminate(): void {
    this.terminateCount += 1;
  }

  private emit(message: TypeScriptWorkerResponse): void {
    for (const listener of this.messageListeners) {
      listener({ data: message } as MessageEvent<TypeScriptWorkerOutgoingMessage>);
    }
  }
}

function project(code: string, registry = createRunJSTypeLibraryRegistry()): CodeEditorTypeScriptProject {
  if (!registry.has('fake-lib')) {
    registry.register({
      id: 'fake-lib',
      libraryName: 'fakeLib',
      loader: () => fakePack(),
      topLevelNames: ['fakeLib'],
    });
  }
  return {
    currentFilePath: 'src/main.ts',
    files: [{ content: code, path: 'src/main.ts' }],
    typeLibraryRegistry: registry,
  };
}

function inMemoryFactory(
  options: { crashAfterPackFirst?: boolean; crashFirst?: boolean; crashSyncFirst?: boolean } = {},
): TypeScriptWorkerFactory {
  let count = 0;
  return () => {
    count += 1;
    return new InMemoryTypeScriptWorker(
      Boolean(options.crashFirst && count === 1),
      Boolean(options.crashAfterPackFirst && count === 1),
      Boolean(options.crashSyncFirst && count === 1),
    );
  };
}

afterEach(async () => {
  for (const session of sessions) session.dispose();
  await Promise.all([...sessions].map((session) => session.whenDisposed()));
  sessions.clear();
  for (const owner of owners) owner.dispose();
  owners.clear();
  clearRunJSTypeLibraryPackRegistryForTests();
});

afterAll(shutdownTypeScriptProjectSessionSuite);

describe('TypeScript worker project session', () => {
  it('does not create a Worker when an unused session is disposed', async () => {
    const workerFactory = vi.fn(() => new InMemoryTypeScriptWorker());
    const session = createTypeScriptProjectSession({ workerFactory });

    session.dispose();
    session.dispose();
    await session.whenDisposed();

    expect(workerFactory).not.toHaveBeenCalled();
  });

  it('terminates a used Worker once and clears retained project state', async () => {
    const worker = new InMemoryTypeScriptWorker();
    const workerFactory = vi.fn(() => worker);
    const session = new WorkerBackedTypeScriptProjectSession(workerFactory);
    const retainedState = session as unknown as { acknowledgedState: unknown };
    const code = 'ctx.logger.info("ready");';
    sessions.add(session);

    expect(await session.getDiagnostics(project(code), code)).toEqual([]);
    expect(retainedState.acknowledgedState).not.toBeNull();

    session.dispose();
    session.dispose();
    await session.whenDisposed();

    expect(workerFactory).toHaveBeenCalledTimes(1);
    expect(worker.terminateCount).toBe(1);
    expect(retainedState.acknowledgedState).toBeNull();
    expect(await session.getDiagnostics(project(code), code)).toEqual([]);
    expect(workerFactory).toHaveBeenCalledTimes(1);
  });

  it('settles pending requests before disposal completes', async () => {
    const loading = deferred<RunJSTypeLibraryPack>();
    const registry = createRunJSTypeLibraryRegistry();
    const loader = vi.fn(() => loading.promise);
    registry.register({ id: 'fake-lib', libraryName: 'fakeLib', loader, topLevelNames: ['fakeLib'] });
    const worker = new InMemoryTypeScriptWorker();
    const session = new WorkerBackedTypeScriptProjectSession(() => worker);
    const code = 'ctx.libs.fakeLib.answer;';
    sessions.add(session);

    const diagnostics = session.getDiagnostics(project(code, registry), code);
    await vi.waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

    session.dispose();
    await session.whenDisposed();

    expect(await diagnostics).toEqual([]);
    expect(worker.terminateCount).toBe(1);
    loading.resolve(fakePack());
  });

  it('loads real built-in React and Ant Design packs through the worker bridge', async () => {
    const code = `
const element = ctx.React.createElement('div');
const Button = ctx.libs.antd.Button;
const button = ctx.React.createElement(Button, { type: 'primary' }, 'Save');
void element; void button;
`;
    const session = createTypeScriptProjectSession({ workerFactory: inMemoryFactory() });
    const currentProject: CodeEditorTypeScriptProject = {
      currentFilePath: 'src/main.tsx',
      files: [{ content: code, path: 'src/main.tsx' }],
    };

    expect(await session.getDiagnostics(currentProject, code)).toEqual([]);
    expect(session.getDebugState().rootFileNames).toEqual(
      expect.arrayContaining([expect.stringMatching(/react/), expect.stringMatching(/antd/)]),
    );
  });

  it('serializes completion, hover, diagnostics, completion changes, and debug state', async () => {
    const code = 'ctx.libs.fakeLib.greet(1); ctx.libs.fakeLib.';
    const session = createTypeScriptProjectSession({ workerFactory: inMemoryFactory() });
    const currentProject = project(code);

    const completion = await session.getCompletionResult(currentProject, code.length, code, true);
    expect(completion?.options.some((entry) => entry.label === 'answer')).toBe(true);
    expect(completion?.options.find((entry) => entry.label === 'greet')?.apply).toBeTypeOf('function');
    const hover = await session.getHover(currentProject, code.indexOf('greet') + 2, code);
    expect(`${hover?.message}\n${hover?.detail}`).toContain('greet');
    expect(await session.getDiagnostics(currentProject, code)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 2345, message: expect.stringMatching(/string/) })]),
    );
    expect(session.getDebugState()).toEqual(
      expect.objectContaining({ disposed: false, languageServiceCreationCount: 1 }),
    );
  });

  it('filters diagnostics explicitly ignored by the worker-backed editor project', async () => {
    const code = 'return ctx.record;';
    const session = createTypeScriptProjectSession({ workerFactory: inMemoryFactory() });
    const currentProject = project(code);

    expect(await session.getDiagnostics(currentProject, code)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 1108 })]),
    );
    expect(
      await session.getDiagnostics(
        {
          ...currentProject,
          ignoredDiagnosticCodes: [1108],
        },
        code,
      ),
    ).toEqual([]);
  });

  it('rewrites built-in worker auto imports to ctx.libs declarations when enabled', async () => {
    const session = createTypeScriptProjectSession({ workerFactory: inMemoryFactory() });
    const code = 'useEff';
    const currentProject: CodeEditorTypeScriptProject = {
      currentFilePath: 'src/main.tsx',
      files: [{ content: code, path: 'src/main.tsx' }],
      rewriteBuiltInAutoImports: true,
      typeLibraryIds: ['react'],
    };
    const completion = await session.getCompletionResult(currentProject, code.length, code, true);
    const useEffectCompletion = completion?.options.find((entry) => entry.label === 'useEffect');
    const dispatch = vi.fn();

    expect(useEffectCompletion?.detail).toBe('Auto import from ctx.libs.React');
    if (typeof useEffectCompletion?.apply === 'function') {
      useEffectCompletion.apply({ dispatch } as never, useEffectCompletion, 0, code.length);
    }
    expect(dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        changes: expect.arrayContaining([
          expect.objectContaining({ from: 0, insert: 'const { useEffect } = ctx.libs.React;\n', to: 0 }),
        ]),
      }),
    );
  });

  it('drops stale requests and rebuilds after a worker crash', async () => {
    const loading = deferred<RunJSTypeLibraryPack>();
    registerRunJSTypeLibraryPackLoader('fake-lib', () => loading.promise);
    const session = createTypeScriptProjectSession({ workerFactory: inMemoryFactory({ crashFirst: true }) });
    const invalid = 'ctx.libs.fakeLib.answer; ctx.missing;';
    const stale = session.getDiagnostics(
      {
        currentFilePath: 'src/main.ts',
        files: [{ content: invalid, path: 'src/main.ts' }],
      },
      invalid,
    );
    const valid = 'ctx.logger.info("ready");';
    expect(
      await session.getDiagnostics(
        { currentFilePath: 'src/main.ts', files: [{ content: valid, path: 'src/main.ts' }] },
        valid,
      ),
    ).toEqual([]);
    loading.resolve(fakePack());
    expect(await stale).toEqual([]);
  });

  it('recovers when the worker fails before acknowledging the initial project sync', async () => {
    const workers: InMemoryTypeScriptWorker[] = [];
    const session = createTypeScriptProjectSession({
      workerFactory: () => {
        const worker = new InMemoryTypeScriptWorker(false, false, workers.length === 0);
        workers.push(worker);
        return worker;
      },
    });
    const code = 'ctx.logger.info("ready");';
    expect(await session.getDiagnostics(project(code), code)).toEqual([]);
    expect(workers).toHaveLength(2);
    expect(workers[0].terminateCount).toBe(1);

    workers[0].emitError('late error from replaced worker');
    expect(await session.getDiagnostics(project(code), code)).toEqual([]);
    expect(workers).toHaveLength(2);

    session.dispose();
    await session.whenDisposed();
    expect(workers[1].terminateCount).toBe(1);
    expect(await session.getDiagnostics(project(code), code)).toEqual([]);
    expect(workers).toHaveLength(2);
  });

  it('falls back to the main thread once when a worker cannot be constructed', async () => {
    const workerFactory = vi.fn(() => {
      throw new Error('module workers unavailable');
    });
    const session = createTypeScriptProjectSession({ workerFactory });
    const code = 'ctx.logger.info("ready");';

    expect(await session.getDiagnostics(project(code), code)).toEqual([]);
    expect(await session.getDiagnostics(project(code), code)).toEqual([]);
    expect(workerFactory).toHaveBeenCalledTimes(1);
  });

  it('drops a stale document version even when the newer request is a different operation', async () => {
    const loading = deferred<RunJSTypeLibraryPack>();
    const registry = createRunJSTypeLibraryRegistry();
    const loader = vi.fn(() => loading.promise);
    registry.register({ id: 'fake-lib', libraryName: 'fakeLib', loader, topLevelNames: ['fakeLib'] });
    const session = createTypeScriptProjectSession({ workerFactory: inMemoryFactory() });
    const staleCode = 'ctx.libs.fakeLib.answer; ctx.missing;';
    const stale = session.getDiagnostics(project(staleCode, registry), staleCode);
    await vi.waitFor(() => expect(loader).toHaveBeenCalledTimes(1));

    const nextCode = 'ctx.logger.info("ready");';
    await session.getHover(project(nextCode, registry), nextCode.indexOf('logger') + 2, nextCode);
    loading.resolve(fakePack());
    expect(await stale).toEqual([]);
  });

  it('sends text edits as file deltas after the initial project snapshot', async () => {
    const worker = new InMemoryTypeScriptWorker();
    const postMessage = vi.spyOn(worker, 'postMessage');
    const session = createTypeScriptProjectSession({ workerFactory: () => worker });
    const firstCode = 'ctx.logger.info("first");';
    const secondCode = 'ctx.logger.info("second");';

    expect(await session.getDiagnostics(project(firstCode), firstCode)).toEqual([]);
    expect(await session.getDiagnostics(project(secondCode), secondCode)).toEqual([]);

    const syncRequests = postMessage.mock.calls
      .map(([message]) => message)
      .filter((message): message is Extract<TypeScriptWorkerRequest, { kind: 'sync' }> => message.kind === 'sync');
    expect(syncRequests[0].snapshot?.files[0].content).toBe(firstCode);
    expect(syncRequests[0]).toEqual(expect.objectContaining({ baseRevision: null, targetRevision: 1 }));
    expect(syncRequests[1].snapshot).toBeUndefined();
    expect(syncRequests[1]).toEqual(
      expect.objectContaining({
        update: expect.objectContaining({
          fileRemovals: [],
          fileUpserts: [{ content: secondCode, path: 'src/main.ts' }],
        }),
        baseRevision: 1,
        targetRevision: 2,
      }),
    );
  });

  const metadataChanges: Array<[string, (project: CodeEditorTypeScriptProject) => CodeEditorTypeScriptProject]> = [
    ['current file', (current) => ({ ...current, currentFilePath: 'src/second.ts' })],
    ['compiler options', (current) => ({ ...current, compilerOptions: { strict: false } })],
    ['RunJS context', (current) => ({ ...current, runJSContext: { modelUse: 'JSBlockModel' } })],
    ['registry', (current) => ({ ...current, typeLibraryRegistry: createRunJSTypeLibraryRegistry() })],
    [
      'library IDs',
      (current) => ({
        ...current,
        typeLibraryIds: ['fake-lib'],
      }),
    ],
    [
      'declaration files',
      (current) => ({
        ...current,
        declarationFiles: [{ content: 'declare const extra: string;', path: 'src/extra.d.ts' }],
      }),
    ],
    ['auto-import rewriting', (current) => ({ ...current, rewriteBuiltInAutoImports: true })],
  ];

  it.each(metadataChanges)('increments the sync revision when %s changes', async (_name, change) => {
    const worker = new ProtocolTestWorker();
    const session = new WorkerBackedTypeScriptProjectSession(() => worker);
    sessions.add(session);
    const files = [
      { content: 'export const first = 1;', path: 'src/first.ts', revision: 1 },
      { content: 'export const second = 2;', path: 'src/second.ts', revision: 2 },
    ];
    const currentProject: CodeEditorTypeScriptProject = {
      currentFilePath: 'src/first.ts',
      documentRevision: 1,
      files,
      projectRevision: 1,
    };

    await session.getDiagnostics(currentProject);
    await session.getDiagnostics(change(currentProject));

    const syncRequests = worker.messages.filter(
      (message): message is Extract<TypeScriptWorkerRequest, { kind: 'sync' }> => message.kind === 'sync',
    );
    expect(syncRequests).toHaveLength(2);
    expect(syncRequests[1]).toEqual(expect.objectContaining({ baseRevision: 1, targetRevision: 2 }));
  });

  it('does not serialize or resend a warm 10 MiB project and sends only changed file revisions', async () => {
    const worker = new ProtocolTestWorker();
    const session = new WorkerBackedTypeScriptProjectSession(() => worker);
    sessions.add(session);
    const content = 'x'.repeat(50_000);
    const files = Array.from({ length: 200 }, (_, index) => ({
      content,
      path: `src/file-${index}.ts`,
      revision: index + 1,
    }));
    const currentProject: CodeEditorTypeScriptProject = {
      currentFilePath: files[0].path,
      documentRevision: 1,
      files,
      projectRevision: 1,
    };

    for (let index = 0; index < 100; index += 1) {
      expect(await session.getDiagnostics(currentProject, content)).toEqual([]);
    }
    expect(worker.messages.filter((message) => message.kind === 'sync')).toHaveLength(1);

    const changedContent = `export const changed = true;${'y'.repeat(50_000)}`;
    const changedFiles = files.map((file, index) =>
      index === 7 ? { ...file, content: changedContent, revision: 201 } : file,
    );
    await session.getDiagnostics({ ...currentProject, files: changedFiles, projectRevision: 2 }, content);
    const changedSync = worker.messages.filter(
      (message): message is Extract<TypeScriptWorkerRequest, { kind: 'sync' }> => message.kind === 'sync',
    )[1];
    expect(changedSync.snapshot).toBeUndefined();
    expect(changedSync.update).toEqual(
      expect.objectContaining({
        fileRemovals: [],
        fileUpserts: [{ content: changedContent, path: 'src/file-7.ts' }],
      }),
    );
    expect(JSON.stringify(changedSync).length).toBeLessThan(100_000);

    await session.getDiagnostics(
      { ...currentProject, files: changedFiles.filter((file) => file.path !== 'src/file-8.ts'), projectRevision: 3 },
      content,
    );
    const deletedSync = worker.messages.filter(
      (message): message is Extract<TypeScriptWorkerRequest, { kind: 'sync' }> => message.kind === 'sync',
    )[2];
    expect(deletedSync.update).toEqual(
      expect.objectContaining({
        fileRemovals: ['src/file-8.ts'],
        fileUpserts: [],
      }),
    );
  });

  it('shares one synchronization ACK for concurrent operations at the same revision', async () => {
    const worker = new ProtocolTestWorker();
    worker.holdSync = true;
    const session = new WorkerBackedTypeScriptProjectSession(() => worker);
    sessions.add(session);
    const code = 'export const value = 1;';
    const currentProject: CodeEditorTypeScriptProject = {
      currentFilePath: 'main.ts',
      documentRevision: 1,
      files: [{ content: code, path: 'main.ts', revision: 1 }],
      projectRevision: 1,
    };

    const diagnostics = session.getDiagnostics(currentProject, code);
    const hover = session.getHover(currentProject, 5, code);
    await vi.waitFor(() => expect(worker.messages.filter((message) => message.kind === 'sync')).toHaveLength(1));
    worker.releaseNextSync();

    await expect(Promise.all([diagnostics, hover])).resolves.toEqual([[], null]);
    expect(worker.messages.filter((message) => message.kind === 'sync')).toHaveLength(1);
  });

  it('applies different revisions in ACK order', async () => {
    const worker = new ProtocolTestWorker();
    const session = new WorkerBackedTypeScriptProjectSession(() => worker);
    sessions.add(session);
    const initialFiles = [
      { content: 'export const a = 0;', path: 'a.ts', revision: 1 },
      { content: 'export const b = 0;', path: 'b.ts', revision: 2 },
    ];
    const initialProject: CodeEditorTypeScriptProject = {
      currentFilePath: 'a.ts',
      documentRevision: 1,
      files: initialFiles,
      projectRevision: 1,
    };
    await session.getDiagnostics(initialProject, initialFiles[0].content);

    worker.holdSync = true;
    const revisionA: CodeEditorTypeScriptProject = {
      ...initialProject,
      documentRevision: 2,
      files: [{ content: 'export const a = 1;', path: 'a.ts', revision: 3 }, initialFiles[1]],
      projectRevision: 2,
    };
    const revisionB: CodeEditorTypeScriptProject = {
      ...initialProject,
      documentRevision: 3,
      files: [initialFiles[0], { content: 'export const b = 2;', path: 'b.ts', revision: 4 }],
      projectRevision: 3,
    };
    const requestA = session.getDiagnostics(revisionA, revisionA.files[0].content);
    const requestB = session.getHover(revisionB, 5, revisionB.files[0].content);

    await vi.waitFor(() => expect(worker.messages.filter((message) => message.kind === 'sync')).toHaveLength(2));
    worker.releaseNextSync();
    await vi.waitFor(() => expect(worker.messages.filter((message) => message.kind === 'sync')).toHaveLength(3));
    const syncRequests = worker.messages.filter(
      (message): message is Extract<TypeScriptWorkerRequest, { kind: 'sync' }> => message.kind === 'sync',
    );
    expect(syncRequests[1]).toEqual(expect.objectContaining({ baseRevision: 1, targetRevision: 2 }));
    expect(syncRequests[2]).toEqual(expect.objectContaining({ baseRevision: 2, targetRevision: 3 }));
    expect(syncRequests[2].update?.fileUpserts).toEqual([
      { content: 'export const a = 0;', path: 'a.ts' },
      { content: 'export const b = 2;', path: 'b.ts' },
    ]);
    worker.releaseNextSync();
    await Promise.all([requestA, requestB]);
  });

  it('fails deterministically when a cached worker responds with an older protocol', async () => {
    const workers: ProtocolTestWorker[] = [];
    const session = new WorkerBackedTypeScriptProjectSession(() => {
      const worker = new ProtocolTestWorker(RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION - 1);
      workers.push(worker);
      return worker;
    });
    sessions.add(session);
    const code = 'export const value = 1;';

    expect(
      await session.getDiagnostics({ currentFilePath: 'main.ts', files: [{ content: code, path: 'main.ts' }] }, code),
    ).toEqual([]);
    expect(workers).toHaveLength(2);
    expect(workers.every((worker) => worker.terminateCount === 1)).toBe(true);
  });

  it('isolates project registries and releases worker-owned state', async () => {
    const first = createRunJSTypeLibraryRegistry();
    first.register({ id: 'fake-lib', libraryName: 'fakeLib', loader: () => fakePack(42), topLevelNames: ['fakeLib'] });
    const second = createRunJSTypeLibraryRegistry();
    second.register({ id: 'fake-lib', libraryName: 'fakeLib', loader: () => fakePack(7), topLevelNames: ['fakeLib'] });
    const owner = new SharedTypeScriptWorkerOwner();
    owners.add(owner);
    const workers: InMemoryTypeScriptWorker[] = [];
    const workerFactory = () => {
      const worker = new InMemoryTypeScriptWorker();
      workers.push(worker);
      return worker;
    };
    const firstSession = createTypeScriptProjectSession({ workerFactory, workerOwner: owner });
    const secondSession = createTypeScriptProjectSession({ workerFactory, workerOwner: owner });

    expect(await firstSession.getDiagnostics(project('ctx.libs.fakeLib.answer satisfies 42;', first))).toEqual([]);
    expect(await secondSession.getDiagnostics(project('ctx.libs.fakeLib.answer satisfies 7;', second))).toEqual([]);
    expect(workers).toHaveLength(1);
    firstSession.dispose();
    await firstSession.whenDisposed();
    expect(firstSession.getDebugState()).toEqual(
      expect.objectContaining({ allFileNames: [], disposed: true, immutableFileCount: 0 }),
    );
    expect(await secondSession.getDiagnostics(project('ctx.libs.fakeLib.answer satisfies 7;', second))).toEqual([]);
    secondSession.dispose();
    await secondSession.whenDisposed();
    owner.dispose();
  });

  it('does not deliver an old worker pack response to a replacement worker with the same bridge id', async () => {
    const oldLoad = deferred<RunJSTypeLibraryPack>();
    const replacementLoad = deferred<RunJSTypeLibraryPack>();
    const registry = createRunJSTypeLibraryRegistry();
    const loader = vi
      .fn<[], Promise<RunJSTypeLibraryPack>>()
      .mockImplementationOnce(() => oldLoad.promise)
      .mockImplementationOnce(() => replacementLoad.promise);
    registry.register({ id: 'fake-lib', libraryName: 'fakeLib', loader, topLevelNames: ['fakeLib'] });
    const session = createTypeScriptProjectSession({
      workerFactory: inMemoryFactory({ crashAfterPackFirst: true }),
    });
    const code = 'ctx.libs.fakeLib.answer satisfies 42;';
    const diagnostics = session.getDiagnostics(project(code, registry), code);

    await vi.waitFor(() => expect(loader).toHaveBeenCalledTimes(2), { timeout: 5_000 });
    oldLoad.resolve(fakePack(99));
    await Promise.resolve();
    replacementLoad.resolve(fakePack(42));
    expect(await diagnostics).toEqual([]);
  });

  it('keeps the protocol JSON serializable and the worker URL bundler-relative', async () => {
    const request: TypeScriptWorkerRequest = {
      documentVersion: 3,
      kind: 'diagnostics',
      projectId: 'project-a',
      protocolVersion: RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION,
      requestId: 9,
    };
    expect(JSON.parse(JSON.stringify(request))).toEqual(request);
    const [source, runtimeSource] = await import('node:fs/promises').then((fs) =>
      Promise.all(
        ['typescriptWorkerProjectSession.ts', 'typescriptWorkerRuntime.ts'].map((fileName) =>
          fs.readFile(`${process.cwd()}/packages/core/client-v2/src/flow/components/code-editor/${fileName}`, 'utf8'),
        ),
      ),
    );
    expect(source).not.toContain(
      "import { runJSTypeScriptEnvironmentPack } from './generated/runJSTypeScriptEnvironmentFiles'",
    );
    expect(source).toContain("await import('./generated/runJSTypeScriptEnvironmentFiles')");
    expect(runtimeSource).toContain("import('./generated/runJSTypeScriptEnvironmentFiles')");
    expect(source).toContain("new URL('./typescriptProject.worker.ts', import.meta.url)");
    expect(source).toContain("type: 'module'");
    const workerGlobals = globalThis as typeof globalThis & { __NOCOBASE_RUNJS_TYPESCRIPT_WORKER_URL__?: string };
    workerGlobals.__NOCOBASE_RUNJS_TYPESCRIPT_WORKER_URL__ = '/sub-app/assets/typescript-worker.js';
    expect(resolveTypeScriptWorkerUrl()).toBe('/sub-app/assets/typescript-worker.js');
    delete workerGlobals.__NOCOBASE_RUNJS_TYPESCRIPT_WORKER_URL__;
  });
});
