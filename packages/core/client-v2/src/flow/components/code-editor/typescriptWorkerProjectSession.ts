/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Completion, CompletionResult } from '@codemirror/autocomplete';
import { RUNJS_TYPESCRIPT_ENVIRONMENT_PACK_ID, type RunJSTypeLibraryRequest } from '@nocobase/runjs/client-v2';

import { runJSTypeScriptEnvironmentPack } from './generated/runJSTypeScriptEnvironmentFiles';
import { getDefaultRunJSTypeLibraryRegistry, type RunJSTypeLibraryRegistry } from './typescriptLibraryRegistry';
import { ensureGeneratedRunJSTypeLibraryPackLoadersRegistered } from './type-packs';
import type {
  CodeEditorTypeScriptProject,
  CodeEditorTypeScriptProjectDebugState,
  CodeEditorTypeScriptDiagnostic,
  CodeEditorTypeScriptProjectInternalError,
  CodeEditorTypeScriptProjectSession,
} from './typescriptProject';
import {
  getTypeScriptWorkerProtocolVersion,
  isTypeScriptWorkerProtocolMessage,
  RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION,
  type TypeScriptWorkerCompletionEntry,
  type TypeScriptWorkerDebugState,
  type TypeScriptWorkerIncomingMessage,
  type TypeScriptWorkerLoadPackRequest,
  type TypeScriptWorkerLoadPackResponse,
  type TypeScriptWorkerOutgoingMessage,
  type TypeScriptWorkerProjectSnapshot,
  type TypeScriptWorkerProjectUpdate,
  type TypeScriptWorkerRequest,
  type TypeScriptWorkerResponse,
} from './typescriptWorkerProtocol';

interface WorkerLike {
  addEventListener(type: 'error', listener: (event: ErrorEvent) => void): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<TypeScriptWorkerOutgoingMessage>) => void): void;
  postMessage(message: TypeScriptWorkerIncomingMessage): void;
  terminate(): void;
}

export type TypeScriptWorkerFactory = () => WorkerLike;

type PendingRequest = {
  reject(error: Error): void;
  resolve(response: TypeScriptWorkerResponse): void;
};

type TypeScriptWorkerClientState = 'not-started' | 'running' | 'stopped';

class TypeScriptWorkerUnavailableError extends Error {
  constructor(readonly cause: unknown) {
    super(cause instanceof Error ? cause.message : String(cause));
  }
}

type TypeScriptWorkerClientRequest = TypeScriptWorkerRequest extends infer Request
  ? Request extends TypeScriptWorkerRequest
    ? Omit<Request, 'protocolVersion' | 'requestId'>
    : never
  : never;

type TypeScriptWorkerOperationRequest = Extract<
  TypeScriptWorkerClientRequest,
  { kind: 'completion' | 'diagnostics' | 'hover' }
>;

type ProjectInputToken = {
  compilerOptions: CodeEditorTypeScriptProject['compilerOptions'];
  currentFileContent?: string;
  currentFilePath: string;
  declarationFiles: CodeEditorTypeScriptProject['declarationFiles'];
  documentRevision?: number;
  files: CodeEditorTypeScriptProject['files'];
  projectRevision?: number;
  registryKey: string;
  rewriteBuiltInAutoImports?: boolean;
  runJSContext: CodeEditorTypeScriptProject['runJSContext'];
  typeLibraryIds: CodeEditorTypeScriptProject['typeLibraryIds'];
};

type SyncedFile = {
  revision?: number;
  wire: TypeScriptWorkerProjectSnapshot['files'][number];
};

type ProjectSyncState = {
  declarationFiles: Map<string, SyncedFile>;
  files: Map<string, SyncedFile>;
  metadataKey: string;
  revision: number;
  snapshot: TypeScriptWorkerProjectSnapshot;
  token: ProjectInputToken;
};

export function resolveTypeScriptWorkerUrl(): string | URL {
  const overrideUrl = (globalThis as { __NOCOBASE_RUNJS_TYPESCRIPT_WORKER_URL__?: string })
    .__NOCOBASE_RUNJS_TYPESCRIPT_WORKER_URL__;
  if (overrideUrl || process.env.NOCOBASE_CLIENT_MODULE_WORKER === 'false') return overrideUrl || '';
  return new URL('./typescriptProject.worker.ts', import.meta.url);
}

function defaultWorkerFactory(): WorkerLike {
  if (process.env.NOCOBASE_CLIENT_MODULE_WORKER === 'false') {
    throw new Error('TypeScript module Worker is not available in this client build.');
  }
  const overrideUrl = (globalThis as { __NOCOBASE_RUNJS_TYPESCRIPT_WORKER_URL__?: string })
    .__NOCOBASE_RUNJS_TYPESCRIPT_WORKER_URL__;
  if (overrideUrl) {
    return new Worker(overrideUrl, { type: 'module' });
  }
  return new Worker(new URL('./typescriptProject.worker.ts', import.meta.url), { type: 'module' });
}

function projectInputToken(project: CodeEditorTypeScriptProject, currentFileContent?: string): ProjectInputToken {
  ensureGeneratedRunJSTypeLibraryPackLoadersRegistered();
  const registry = project.typeLibraryRegistry || getDefaultRunJSTypeLibraryRegistry();
  return {
    compilerOptions: project.compilerOptions,
    currentFileContent,
    currentFilePath: project.currentFilePath,
    declarationFiles: project.declarationFiles,
    documentRevision: project.documentRevision,
    files: project.files,
    projectRevision: project.projectRevision,
    registryKey: registry.getCacheKey(),
    rewriteBuiltInAutoImports: project.rewriteBuiltInAutoImports,
    runJSContext: project.runJSContext,
    typeLibraryIds: project.typeLibraryIds,
  };
}

function normalizePath(path: string): string {
  return (
    String(path || '')
      .replace(/\\/gu, '/')
      .replace(/^\/+|\s+$/gu, '')
      .replace(/\/+/gu, '/') || 'main.tsx'
  );
}

function isSameProjectInput(left: ProjectInputToken | null, right: ProjectInputToken): boolean {
  return Boolean(
    left &&
      left.compilerOptions === right.compilerOptions &&
      (left.documentRevision !== undefined && right.documentRevision !== undefined
        ? true
        : left.currentFileContent === right.currentFileContent) &&
      left.currentFilePath === right.currentFilePath &&
      left.declarationFiles === right.declarationFiles &&
      left.documentRevision === right.documentRevision &&
      left.files === right.files &&
      left.projectRevision === right.projectRevision &&
      left.registryKey === right.registryKey &&
      left.rewriteBuiltInAutoImports === right.rewriteBuiltInAutoImports &&
      left.runJSContext === right.runJSContext &&
      left.typeLibraryIds === right.typeLibraryIds,
  );
}

function buildSyncedFiles(
  files: CodeEditorTypeScriptProject['files'],
  previous: Map<string, SyncedFile> | undefined,
  currentFile?: { content: string; path: string; revision?: number },
): Map<string, SyncedFile> {
  const next = new Map<string, SyncedFile>();
  for (const file of files || []) {
    const path = normalizePath(file.path);
    const content = currentFile?.path === path ? currentFile.content : file.content;
    const revision = currentFile?.path === path ? currentFile.revision : file.revision;
    const retained = previous?.get(path);
    next.set(
      path,
      retained &&
        ((revision !== undefined && retained.revision === revision) ||
          (revision === undefined && retained.wire.content === content))
        ? retained
        : { revision, wire: { content, path } },
    );
  }
  if (currentFile && !next.has(currentFile.path)) {
    const retained = previous?.get(currentFile.path);
    next.set(
      currentFile.path,
      retained &&
        ((currentFile.revision !== undefined && retained.revision === currentFile.revision) ||
          (currentFile.revision === undefined && retained.wire.content === currentFile.content))
        ? retained
        : { revision: currentFile.revision, wire: { content: currentFile.content, path: currentFile.path } },
    );
  }
  return next;
}

function buildProjectSyncState(
  project: CodeEditorTypeScriptProject,
  currentFileContent: string | undefined,
  token: ProjectInputToken,
  revision: number,
  previous?: ProjectSyncState,
): ProjectSyncState {
  ensureGeneratedRunJSTypeLibraryPackLoadersRegistered();
  const registry = project.typeLibraryRegistry || getDefaultRunJSTypeLibraryRegistry();
  const currentFilePath = normalizePath(project.currentFilePath);
  const files = buildSyncedFiles(
    project.files || [],
    previous?.files,
    typeof currentFileContent === 'string'
      ? { content: currentFileContent, path: currentFilePath, revision: project.documentRevision }
      : undefined,
  );
  const declarationFiles = buildSyncedFiles(project.declarationFiles || [], previous?.declarationFiles);
  const metadata = {
    compilerOptions: project.compilerOptions as Record<string, unknown> | undefined,
    currentFilePath,
    registryKey: token.registryKey,
    rewriteBuiltInAutoImports: project.rewriteBuiltInAutoImports,
    runJSContext: project.runJSContext,
    typeLibraryIds: [...(project.typeLibraryIds || [])],
    typeLibraryUsageDefinitions: registry.getUsageDefinitions(),
  };
  return {
    declarationFiles,
    files,
    metadataKey: JSON.stringify(metadata),
    revision,
    snapshot: {
      ...metadata,
      declarationFiles: [...declarationFiles.values()].map((file) => file.wire),
      files: [...files.values()].map((file) => file.wire),
    },
    token,
  };
}

function fileDelta(
  previous: Map<string, SyncedFile>,
  next: Map<string, SyncedFile>,
): { removals: string[]; upserts: TypeScriptWorkerProjectSnapshot['files'] } {
  return {
    removals: [...previous.keys()].filter((path) => !next.has(path)),
    upserts: [...next.entries()].filter(([path, file]) => previous.get(path) !== file).map(([, file]) => file.wire),
  };
}

function projectUpdate(previous: ProjectSyncState, next: ProjectSyncState): TypeScriptWorkerProjectUpdate {
  const files = fileDelta(previous.files, next.files);
  const declarations = fileDelta(previous.declarationFiles, next.declarationFiles);
  return {
    compilerOptions: next.snapshot.compilerOptions,
    currentFilePath: next.snapshot.currentFilePath,
    declarationFileRemovals: declarations.removals,
    declarationFileUpserts: declarations.upserts,
    fileRemovals: files.removals,
    fileUpserts: files.upserts,
    registryKey: next.snapshot.registryKey,
    runJSContext: next.snapshot.runJSContext,
    typeLibraryIds: next.snapshot.typeLibraryIds,
    typeLibraryUsageDefinitions: next.snapshot.typeLibraryUsageDefinitions,
    rewriteBuiltInAutoImports: next.snapshot.rewriteBuiltInAutoImports,
  };
}

function hasProjectUpdate(update: TypeScriptWorkerProjectUpdate, previous: ProjectSyncState, next: ProjectSyncState) {
  return (
    previous.metadataKey !== next.metadataKey ||
    update.fileRemovals.length > 0 ||
    update.fileUpserts.length > 0 ||
    update.declarationFileRemovals.length > 0 ||
    update.declarationFileUpserts.length > 0
  );
}

function toCompletion(entry: TypeScriptWorkerCompletionEntry): Completion {
  return {
    apply(view, _completion, from, to) {
      if (entry.unavailable) return;
      const changes = [...entry.changes, { from, insert: entry.label, to }].sort(
        (left, right) => left.from - right.from,
      );
      const deltaBeforeTarget = changes.reduce(
        (sum, change) => (change.to <= from ? sum + change.insert.length - (change.to - change.from) : sum),
        0,
      );
      view.dispatch({
        changes,
        scrollIntoView: true,
        selection: { anchor: from + deltaBeforeTarget + entry.label.length },
      });
    },
    boost: entry.boost,
    detail: entry.detail,
    info: entry.info,
    label: entry.label,
    type: entry.type as Completion['type'],
  };
}

class TypeScriptWorkerClient {
  private worker: WorkerLike | null = null;
  private pending = new Map<number, PendingRequest>();
  private requestId = 0;
  private registry: RunJSTypeLibraryRegistry | null = getDefaultRunJSTypeLibraryRegistry();
  private state: TypeScriptWorkerClientState = 'not-started';

  constructor(private readonly factory: TypeScriptWorkerFactory) {}

  setRegistry(registry: RunJSTypeLibraryRegistry): void {
    this.registry = registry;
  }

  async request(request: TypeScriptWorkerClientRequest): Promise<TypeScriptWorkerResponse> {
    const requestId = ++this.requestId;
    const worker = this.ensureWorker();
    const message = {
      ...request,
      protocolVersion: RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION,
      requestId,
    } as TypeScriptWorkerRequest;
    return await new Promise<TypeScriptWorkerResponse>((resolve, reject) => {
      this.pending.set(requestId, { reject, resolve });
      worker.postMessage(message);
    });
  }

  reset(reason = 'TypeScript worker terminated.'): void {
    const worker = this.worker;
    this.worker = null;
    if (worker && this.state === 'running') worker.terminate();
    this.state = 'stopped';
    this.registry = null;
    const error = new Error(reason);
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  }

  private ensureWorker(): WorkerLike {
    if (this.worker) return this.worker;
    let worker: WorkerLike;
    try {
      worker = this.factory();
    } catch (error: unknown) {
      this.state = 'stopped';
      throw new TypeScriptWorkerUnavailableError(error);
    }
    worker.addEventListener('message', (event) => this.onMessage(worker, event.data));
    worker.addEventListener('error', (event) => {
      if (this.worker === worker) this.reset(event.message || 'TypeScript worker crashed.');
    });
    this.worker = worker;
    this.state = 'running';
    return worker;
  }

  private onMessage(sourceWorker: WorkerLike, message: TypeScriptWorkerOutgoingMessage): void {
    if (!isTypeScriptWorkerProtocolMessage(message)) {
      const version = getTypeScriptWorkerProtocolVersion(message);
      if (version !== null && this.worker === sourceWorker) {
        this.reset(
          `RunJS TypeScript worker protocol mismatch: client=${RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION}, worker=${version}`,
        );
      }
      return;
    }
    if (message.kind === 'load-pack') {
      this.loadPack(sourceWorker, message);
      return;
    }
    const pending = this.pending.get(message.requestId);
    if (!pending) return;
    this.pending.delete(message.requestId);
    if (message.kind === 'error') pending.reject(new Error(message.error));
    else pending.resolve(message);
  }

  private async loadPack(sourceWorker: WorkerLike, message: TypeScriptWorkerLoadPackRequest): Promise<void> {
    const response: TypeScriptWorkerLoadPackResponse = {
      bridgeRequestId: message.bridgeRequestId,
      kind: 'load-pack-result',
      projectId: message.projectId,
      protocolVersion: RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION,
    };
    try {
      if (message.request.packId === RUNJS_TYPESCRIPT_ENVIRONMENT_PACK_ID) {
        response.pack = runJSTypeScriptEnvironmentPack;
        if (this.worker === sourceWorker) sourceWorker.postMessage(response);
        return;
      }
      const registry = this.registry;
      if (!registry) throw new Error('TypeScript worker registry is no longer available.');
      response.pack = await registry.loadPackForWorker(message.request as RunJSTypeLibraryRequest);
    } catch (error: unknown) {
      response.error = error instanceof Error ? error.message : String(error);
    }
    if (this.worker === sourceWorker) sourceWorker.postMessage(response);
  }
}

let projectSequence = 0;

export class WorkerBackedTypeScriptProjectSession implements CodeEditorTypeScriptProjectSession {
  private readonly client: TypeScriptWorkerClient;
  private readonly projectId = `runjs-typescript-${++projectSequence}`;
  private disposal: Promise<void> = Promise.resolve();
  private disposed = false;
  private documentVersion = 0;
  private lastDebugState: CodeEditorTypeScriptProjectDebugState = {
    allFileNames: [],
    disposed: false,
    fileVersions: {},
    immutableFileCount: 0,
    immutableSnapshotCreationCount: 0,
    languageServiceCreationCount: 0,
    rootFileNames: [],
  };
  private lastInternalError: CodeEditorTypeScriptProjectInternalError | null = null;
  private acknowledgedState: ProjectSyncState | null = null;
  private latestRequestIds = new Map<'completion' | 'diagnostics' | 'hover', number>();
  private pendingRequestCount = 0;
  private requestSequence = 0;
  private resolveDisposal: (() => void) | null = null;
  private syncChain: Promise<void> = Promise.resolve();
  private workerNeedsFullSync = false;
  private workerUnavailable = false;

  constructor(
    factory: TypeScriptWorkerFactory = defaultWorkerFactory,
    private fallback?: CodeEditorTypeScriptProjectSession,
  ) {
    this.client = new TypeScriptWorkerClient(factory);
  }

  async getCompletionResult(
    project: CodeEditorTypeScriptProject,
    position: number,
    currentFileContent?: string,
    explicit = false,
  ): Promise<CompletionResult | null> {
    if (this.disposed) return null;
    if (this.workerUnavailable) {
      return (await this.fallback?.getCompletionResult(project, position, currentFileContent, explicit)) ?? null;
    }
    const requestId = this.begin('completion');
    try {
      const documentVersion = await this.sync(project, currentFileContent);
      const response = await this.requestWithRecovery(project, currentFileContent, {
        documentVersion,
        explicit,
        kind: 'completion',
        position,
        projectId: this.projectId,
      });
      if (
        !this.isCurrentResponse('completion', requestId, response) ||
        response.kind !== 'completion-result' ||
        !response.result
      ) {
        return null;
      }
      return {
        from: response.result.from,
        options: response.result.options.map(toCompletion),
        to: response.result.to,
        validFor: explicit ? undefined : /^[$_\p{Letter}\p{Number}]*$/u,
      };
    } catch (error: unknown) {
      return (
        (await this.useFallback(project, error))?.getCompletionResult(
          project,
          position,
          currentFileContent,
          explicit,
        ) ?? null
      );
    } finally {
      this.finishRequest();
    }
  }

  async getDiagnostics(
    project: CodeEditorTypeScriptProject,
    currentFileContent?: string,
  ): Promise<CodeEditorTypeScriptDiagnostic[]> {
    if (this.disposed) return [];
    if (this.workerUnavailable) return (await this.fallback?.getDiagnostics(project, currentFileContent)) ?? [];
    const requestId = this.begin('diagnostics');
    try {
      const documentVersion = await this.sync(project, currentFileContent);
      const response = await this.requestWithRecovery(project, currentFileContent, {
        documentVersion,
        kind: 'diagnostics',
        projectId: this.projectId,
      });
      if (!this.isCurrentResponse('diagnostics', requestId, response) || response.kind !== 'diagnostics-result')
        return [];
      if (!project.ignoredDiagnosticCodes?.length) {
        return response.result;
      }
      const ignoredCodes = new Set(project.ignoredDiagnosticCodes);
      return response.result.filter((diagnostic) => !ignoredCodes.has(diagnostic.code));
    } catch (error: unknown) {
      return (await this.useFallback(project, error))?.getDiagnostics(project, currentFileContent) ?? [];
    } finally {
      this.finishRequest();
    }
  }

  async getHover(project: CodeEditorTypeScriptProject, position: number, currentFileContent?: string) {
    if (this.disposed) return null;
    if (this.workerUnavailable) return (await this.fallback?.getHover(project, position, currentFileContent)) ?? null;
    const requestId = this.begin('hover');
    try {
      const documentVersion = await this.sync(project, currentFileContent);
      const response = await this.requestWithRecovery(project, currentFileContent, {
        documentVersion,
        kind: 'hover',
        position,
        projectId: this.projectId,
      });
      if (!this.isCurrentResponse('hover', requestId, response) || response.kind !== 'hover-result') return null;
      return response.result;
    } catch (error: unknown) {
      return (await this.useFallback(project, error))?.getHover(project, position, currentFileContent) ?? null;
    } finally {
      this.finishRequest();
    }
  }

  getDebugState(): CodeEditorTypeScriptProjectDebugState {
    return this.workerUnavailable && this.fallback ? this.fallback.getDebugState() : this.lastDebugState;
  }

  getLastInternalError(): CodeEditorTypeScriptProjectInternalError | null {
    return this.lastInternalError;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const fallback = this.fallback;
    this.fallback = undefined;
    fallback?.dispose();
    const requestsDisposed =
      this.pendingRequestCount > 0
        ? new Promise<void>((resolve) => {
            this.resolveDisposal = resolve;
          })
        : Promise.resolve();
    this.disposal = Promise.all([fallback?.whenDisposed(), requestsDisposed]).then(() => undefined);
    this.client.reset('TypeScript project session has been disposed.');
    this.acknowledgedState = null;
    this.workerNeedsFullSync = false;
    this.lastInternalError = null;
    this.lastDebugState = {
      ...this.lastDebugState,
      allFileNames: [],
      disposed: true,
      fileVersions: {},
      immutableFileCount: 0,
      immutableSnapshotCreationCount: 0,
      rootFileNames: [],
      structureKey: undefined,
    };
    this.latestRequestIds.clear();
  }

  whenDisposed(): Promise<void> {
    return this.disposal;
  }

  private begin(kind: 'completion' | 'diagnostics' | 'hover'): number {
    this.pendingRequestCount += 1;
    const id = ++this.requestSequence;
    this.latestRequestIds.set(kind, id);
    return id;
  }

  private finishRequest(): void {
    this.pendingRequestCount -= 1;
    if (!this.disposed || this.pendingRequestCount !== 0) return;
    this.resolveDisposal?.();
    this.resolveDisposal = null;
  }

  private isCurrent(kind: 'completion' | 'diagnostics' | 'hover', requestId: number): boolean {
    return !this.disposed && this.latestRequestIds.get(kind) === requestId;
  }

  private isCurrentResponse(
    kind: 'completion' | 'diagnostics' | 'hover',
    requestId: number,
    response: TypeScriptWorkerResponse,
  ): boolean {
    return (
      this.isCurrent(kind, requestId) &&
      response.projectId === this.projectId &&
      response.documentVersion === this.documentVersion
    );
  }

  private sync(project: CodeEditorTypeScriptProject, currentFileContent?: string, force = false): Promise<number> {
    const token = projectInputToken(project, currentFileContent);
    const capturedProject = { ...project };
    const pending = this.syncChain.then(() => this.performSync(capturedProject, currentFileContent, token, force));
    this.syncChain = pending.then(
      () => undefined,
      () => undefined,
    );
    return pending;
  }

  private async performSync(
    project: CodeEditorTypeScriptProject,
    currentFileContent: string | undefined,
    token: ProjectInputToken,
    force: boolean,
  ): Promise<number> {
    if (this.disposed) throw new Error('TypeScript project session has been disposed.');
    const previous = this.acknowledgedState;
    if (!force && !this.workerNeedsFullSync && isSameProjectInput(previous?.token || null, token)) {
      return previous?.revision || 0;
    }

    const registry = project.typeLibraryRegistry || getDefaultRunJSTypeLibraryRegistry();
    const next =
      previous && isSameProjectInput(previous.token, token)
        ? previous
        : buildProjectSyncState(
            project,
            currentFileContent,
            token,
            (previous?.revision || 0) + 1,
            previous || undefined,
          );
    const update = previous && next !== previous ? projectUpdate(previous, next) : null;
    if (previous && update && !hasProjectUpdate(update, previous, next)) {
      previous.token = token;
      return previous.revision;
    }

    const fullSync = force || this.workerNeedsFullSync || !previous;
    const request: TypeScriptWorkerClientRequest = {
      baseRevision: fullSync ? null : previous.revision,
      documentVersion: next.revision,
      kind: 'sync',
      projectId: this.projectId,
      targetRevision: next.revision,
      ...(fullSync ? { snapshot: next.snapshot } : { update: update as TypeScriptWorkerProjectUpdate }),
    };
    this.client.setRegistry(registry);
    let response: TypeScriptWorkerResponse;
    try {
      response = await this.client.request(request);
    } catch (error: unknown) {
      if (error instanceof TypeScriptWorkerUnavailableError) throw error;
      this.resetWorkerState('Rebuilding TypeScript worker after synchronization failure.');
      this.client.setRegistry(registry);
      response = await this.client.request({
        baseRevision: null,
        documentVersion: next.revision,
        kind: 'sync',
        projectId: this.projectId,
        snapshot: next.snapshot,
        targetRevision: next.revision,
      });
    }
    if (response.kind !== 'synced') throw new Error('TypeScript worker did not acknowledge project synchronization.');
    this.acknowledgedState = next;
    this.documentVersion = next.revision;
    this.workerNeedsFullSync = false;
    return next.revision;
  }

  private async requestWithRecovery(
    project: CodeEditorTypeScriptProject,
    currentFileContent: string | undefined,
    request: TypeScriptWorkerOperationRequest,
  ): Promise<TypeScriptWorkerResponse> {
    try {
      const response = await this.client.request(request);
      await this.refreshDebugState();
      return response;
    } catch (error: unknown) {
      if (error instanceof TypeScriptWorkerUnavailableError) throw error;
      this.resetWorkerState('Rebuilding TypeScript worker after failure.');
      const documentVersion = await this.sync(project, currentFileContent, true);
      const recoveredRequest = { ...request, documentVersion };
      const response = await this.client.request(recoveredRequest);
      await this.refreshDebugState();
      return response;
    }
  }

  private resetWorkerState(reason: string): void {
    this.client.reset(reason);
    this.workerNeedsFullSync = true;
    this.lastDebugState = { ...this.lastDebugState, languageServiceCreationCount: 0 };
  }

  private async refreshDebugState(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') return;
    const response = await this.client.request({
      documentVersion: this.documentVersion,
      kind: 'debug',
      projectId: this.projectId,
    });
    if (response.kind !== 'debug-result') return;
    this.lastDebugState = response.result as TypeScriptWorkerDebugState;
  }

  private report(project: CodeEditorTypeScriptProject, error: unknown): void {
    const internalError: CodeEditorTypeScriptProjectInternalError = {
      cause: error,
      code: 'TYPE_LIBRARY_LOAD_FAILED',
      message: error instanceof Error ? error.message : String(error),
      packIds: [],
    };
    this.lastInternalError = internalError;
    try {
      project.onInternalError?.(internalError);
    } catch (_) {
      // Error observers must not break editor requests.
    }
  }

  private useFallback(
    project: CodeEditorTypeScriptProject,
    error: unknown,
  ): CodeEditorTypeScriptProjectSession | undefined {
    if (this.disposed) return;
    this.report(project, error);
    if (!this.fallback) return;
    this.workerUnavailable = true;
    this.client.reset('TypeScript worker unavailable; using the main thread.');
    return this.fallback;
  }
}

export function canUseTypeScriptWorker(): boolean {
  if (process.env.NOCOBASE_CLIENT_MODULE_WORKER === 'false') return false;
  const forced = (globalThis as { __NOCOBASE_RUNJS_TYPESCRIPT_WORKER__?: boolean })
    .__NOCOBASE_RUNJS_TYPESCRIPT_WORKER__;
  return (
    typeof window !== 'undefined' &&
    typeof Worker !== 'undefined' &&
    (forced === true || process.env.NODE_ENV !== 'test')
  );
}
