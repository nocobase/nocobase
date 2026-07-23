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

import type { TypeScriptWorkerOwner, TypeScriptWorkerOwnerResource } from './sharedTypeScriptWorkerOwner';
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
  projectId: string;
  reject(error: Error): void;
  resolve(response: TypeScriptWorkerResponse): void;
};

type QueuedRequest = PendingRequest & {
  message: TypeScriptWorkerRequest;
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
  declarationFiles: NonNullable<CodeEditorTypeScriptProject['declarationFiles']>;
  documentRevision?: number;
  files: CodeEditorTypeScriptProject['files'];
  metadataKey: string;
  projectRevision?: number;
  registry: RunJSTypeLibraryRegistry;
  registryKey: string;
  rewriteBuiltInAutoImports?: boolean;
  runJSContext: CodeEditorTypeScriptProject['runJSContext'];
  typeLibraryIds: CodeEditorTypeScriptProject['typeLibraryIds'];
  typeLibraryUsageDefinitions: ReturnType<RunJSTypeLibraryRegistry['getUsageDefinitions']>;
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
  const compilerOptions = project.compilerOptions ? { ...project.compilerOptions } : undefined;
  const currentFilePath = normalizePath(project.currentFilePath);
  const declarationFiles = (project.declarationFiles || []).map((file) => ({ ...file }));
  const files = (project.files || []).map((file) => ({ ...file }));
  const registryKey = registry.getCacheKey();
  const runJSContext = project.runJSContext ? { ...project.runJSContext } : undefined;
  const typeLibraryIds = project.typeLibraryIds ? [...project.typeLibraryIds] : undefined;
  const typeLibraryUsageDefinitions = registry.getUsageDefinitions();
  return {
    compilerOptions,
    currentFileContent,
    currentFilePath,
    declarationFiles,
    documentRevision: project.documentRevision,
    files,
    metadataKey: JSON.stringify({
      compilerOptions,
      currentFilePath,
      registryKey,
      rewriteBuiltInAutoImports: project.rewriteBuiltInAutoImports,
      runJSContext,
      typeLibraryIds,
      typeLibraryUsageDefinitions,
    }),
    projectRevision: project.projectRevision,
    registry,
    registryKey,
    rewriteBuiltInAutoImports: project.rewriteBuiltInAutoImports,
    runJSContext,
    typeLibraryIds,
    typeLibraryUsageDefinitions,
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
      left.currentFileContent === right.currentFileContent &&
      left.documentRevision === right.documentRevision &&
      sameProjectFiles(left.declarationFiles, right.declarationFiles) &&
      sameProjectFiles(left.files, right.files) &&
      left.metadataKey === right.metadataKey &&
      left.projectRevision === right.projectRevision &&
      left.registry === right.registry,
  );
}

function sameProjectFiles(
  left: CodeEditorTypeScriptProject['files'],
  right: CodeEditorTypeScriptProject['files'],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (file, index) =>
        file.path === right[index].path &&
        file.content === right[index].content &&
        file.revision === right[index].revision,
    )
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
      retained && retained.revision === revision && retained.wire.content === content
        ? retained
        : { revision, wire: { content, path } },
    );
  }
  if (currentFile && !next.has(currentFile.path)) {
    const retained = previous?.get(currentFile.path);
    next.set(
      currentFile.path,
      retained && retained.revision === currentFile.revision && retained.wire.content === currentFile.content
        ? retained
        : { revision: currentFile.revision, wire: { content: currentFile.content, path: currentFile.path } },
    );
  }
  return next;
}

function buildProjectSyncState(
  token: ProjectInputToken,
  revision: number,
  previous?: ProjectSyncState,
): ProjectSyncState {
  const currentFilePath = token.currentFilePath;
  const files = buildSyncedFiles(
    token.files,
    previous?.files,
    typeof token.currentFileContent === 'string'
      ? { content: token.currentFileContent, path: currentFilePath, revision: token.documentRevision }
      : undefined,
  );
  const declarationFiles = buildSyncedFiles(token.declarationFiles, previous?.declarationFiles);
  const metadata = {
    compilerOptions: token.compilerOptions as Record<string, unknown> | undefined,
    currentFilePath,
    registryKey: token.registryKey,
    rewriteBuiltInAutoImports: token.rewriteBuiltInAutoImports,
    runJSContext: token.runJSContext,
    typeLibraryIds: token.typeLibraryIds || [],
    typeLibraryUsageDefinitions: token.typeLibraryUsageDefinitions,
  };
  return {
    declarationFiles,
    files,
    metadataKey: token.metadataKey,
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

export class TypeScriptWorkerClient {
  private worker: WorkerLike | null = null;
  private pending = new Map<number, PendingRequest>();
  private queues = new Map<string, QueuedRequest[]>();
  private lastProjectId: string | null = null;
  private pumpScheduled = false;
  private requestId = 0;
  private registries = new Map<string, RunJSTypeLibraryRegistry>();
  private state: TypeScriptWorkerClientState = 'not-started';

  constructor(private readonly factory: TypeScriptWorkerFactory) {}

  setRegistry(projectId: string, registry: RunJSTypeLibraryRegistry): void {
    this.registries.set(projectId, registry);
  }

  async request(request: TypeScriptWorkerClientRequest): Promise<TypeScriptWorkerResponse> {
    const requestId = ++this.requestId;
    const message = {
      ...request,
      protocolVersion: RUNJS_TYPESCRIPT_WORKER_PROTOCOL_VERSION,
      requestId,
    } as TypeScriptWorkerRequest;
    return await new Promise<TypeScriptWorkerResponse>((resolve, reject) => {
      const queue = this.queues.get(request.projectId) || [];
      queue.push({ message, projectId: request.projectId, reject, resolve });
      this.queues.set(request.projectId, queue);
      this.schedulePump();
    });
  }

  cancelProject(projectId: string, reason = 'TypeScript project session has been disposed.'): void {
    const error = new Error(reason);
    for (const [requestId, pending] of this.pending) {
      if (pending.projectId !== projectId) continue;
      pending.reject(error);
      this.pending.delete(requestId);
    }
    const queue = this.queues.get(projectId);
    for (const pending of queue || []) pending.reject(error);
    this.queues.delete(projectId);
  }

  async disposeProject(projectId: string, documentVersion: number): Promise<void> {
    if (!this.worker) {
      this.registries.delete(projectId);
      return;
    }
    try {
      await this.request({ documentVersion, kind: 'dispose', projectId });
    } finally {
      this.registries.delete(projectId);
    }
  }

  restart(reason = 'TypeScript worker terminated.'): void {
    this.reset(reason, false);
  }

  stop(reason = 'TypeScript worker owner has been disposed.'): void {
    this.reset(reason, true);
  }

  private reset(reason: string, clearRegistries: boolean): void {
    const worker = this.worker;
    this.worker = null;
    if (worker && this.state === 'running') worker.terminate();
    this.state = clearRegistries ? 'stopped' : 'not-started';
    const error = new Error(reason);
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
    for (const queue of this.queues.values()) {
      for (const pending of queue) pending.reject(error);
    }
    this.queues.clear();
    this.lastProjectId = null;
    this.pumpScheduled = false;
    if (clearRegistries) this.registries.clear();
  }

  private ensureWorker(): WorkerLike {
    if (this.worker) return this.worker;
    if (this.state === 'stopped') {
      throw new TypeScriptWorkerUnavailableError('TypeScript worker owner has been disposed.');
    }
    let worker: WorkerLike;
    try {
      worker = this.factory();
    } catch (error: unknown) {
      this.state = 'stopped';
      throw new TypeScriptWorkerUnavailableError(error);
    }
    worker.addEventListener('message', (event) => this.onMessage(worker, event.data));
    worker.addEventListener('error', (event) => {
      if (this.worker === worker) this.restart(event.message || 'TypeScript worker crashed.');
    });
    this.worker = worker;
    this.state = 'running';
    return worker;
  }

  private onMessage(sourceWorker: WorkerLike, message: TypeScriptWorkerOutgoingMessage): void {
    if (!isTypeScriptWorkerProtocolMessage(message)) {
      const version = getTypeScriptWorkerProtocolVersion(message);
      if (version !== null && this.worker === sourceWorker) {
        this.restart(
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
    if (pending) {
      this.pending.delete(message.requestId);
      if (message.kind === 'error') pending.reject(new Error(message.error));
      else pending.resolve(message);
    }
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
        response.pack = (await import('./generated/runJSTypeScriptEnvironmentFiles')).runJSTypeScriptEnvironmentPack;
        if (this.worker === sourceWorker) sourceWorker.postMessage(response);
        return;
      }
      const registry = this.registries.get(message.projectId);
      if (!registry) throw new Error('TypeScript worker registry is no longer available.');
      response.pack = await registry.loadPackForWorker(message.request as RunJSTypeLibraryRequest);
    } catch (error: unknown) {
      response.error = error instanceof Error ? error.message : String(error);
    }
    if (this.worker === sourceWorker) sourceWorker.postMessage(response);
  }

  private pump(): void {
    this.pumpScheduled = false;
    const projectIds = [...this.queues.entries()]
      .filter(([, queue]) => queue.length > 0)
      .map(([projectId]) => projectId);
    if (!projectIds.length) return;
    const lastIndex = this.lastProjectId ? projectIds.indexOf(this.lastProjectId) : -1;
    const projectId = projectIds[(lastIndex + 1) % projectIds.length];
    const queue = this.queues.get(projectId);
    const pending = queue?.shift();
    if (!pending) return;
    if (!queue.length) this.queues.delete(projectId);
    this.lastProjectId = projectId;
    try {
      const worker = this.ensureWorker();
      this.pending.set(pending.message.requestId, pending);
      worker.postMessage(pending.message);
    } catch (error: unknown) {
      this.pending.delete(pending.message.requestId);
      pending.reject(error instanceof Error ? error : new Error(String(error)));
    }
    this.schedulePump();
  }

  private schedulePump(): void {
    if (this.pumpScheduled) return;
    this.pumpScheduled = true;
    queueMicrotask(() => this.pump());
  }
}

interface TypeScriptWorkerOwnerLease {
  client: TypeScriptWorkerClient;
  release(projectId: string, documentVersion: number): Promise<void>;
}

class SharedTypeScriptWorkerClientResource implements TypeScriptWorkerOwnerResource {
  private readonly client: TypeScriptWorkerClient;
  private disposed = false;
  private leaseCount = 0;

  constructor(workerFactory: TypeScriptWorkerFactory) {
    this.client = new TypeScriptWorkerClient(workerFactory);
  }

  acquire(): TypeScriptWorkerOwnerLease {
    if (this.disposed) throw new Error('TypeScript worker owner resource has been disposed.');
    this.leaseCount += 1;
    let released = false;
    return {
      client: this.client,
      release: async (projectId, documentVersion) => {
        if (released) return;
        released = true;
        this.client.cancelProject(projectId);
        this.leaseCount -= 1;
        if (this.disposed) {
          this.client.stop();
          return;
        }
        if (this.leaseCount === 0) {
          this.client.restart('Last TypeScript project has been disposed.');
          await this.client.disposeProject(projectId, documentVersion);
          return;
        }
        try {
          await this.client.disposeProject(projectId, documentVersion);
        } catch (_) {
          // A crashed worker has already discarded its project state.
        }
      },
    };
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.leaseCount = 0;
    this.client.stop();
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
  private readonly releaseClient: TypeScriptWorkerOwnerLease['release'];

  constructor(
    factory: TypeScriptWorkerFactory = defaultWorkerFactory,
    private fallback?: CodeEditorTypeScriptProjectSession,
    owner?: TypeScriptWorkerOwner,
  ) {
    if (owner) {
      const lease = owner.getResource(() => new SharedTypeScriptWorkerClientResource(factory)).acquire();
      this.client = lease.client;
      this.releaseClient = lease.release;
    } else {
      this.client = new TypeScriptWorkerClient(factory);
      this.releaseClient = async (projectId) => {
        this.client.cancelProject(projectId);
        this.client.stop();
      };
    }
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
    const clientDisposal = this.releaseClient(this.projectId, this.documentVersion);
    this.disposal = Promise.all([fallback?.whenDisposed(), requestsDisposed, clientDisposal]).then(() => undefined);
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
    const pending = this.syncChain.then(() => this.performSync(token, force));
    this.syncChain = pending.then(
      () => undefined,
      () => undefined,
    );
    return pending;
  }

  private async performSync(token: ProjectInputToken, force: boolean): Promise<number> {
    if (this.disposed) throw new Error('TypeScript project session has been disposed.');
    const previous = this.acknowledgedState;
    if (!force && !this.workerNeedsFullSync && isSameProjectInput(previous?.token || null, token)) {
      return previous?.revision || 0;
    }

    const registry = token.registry;
    const next =
      previous && isSameProjectInput(previous.token, token)
        ? previous
        : buildProjectSyncState(token, (previous?.revision || 0) + 1, previous || undefined);
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
    this.client.setRegistry(this.projectId, registry);
    let response: TypeScriptWorkerResponse;
    try {
      response = await this.client.request(request);
    } catch (error: unknown) {
      if (error instanceof TypeScriptWorkerUnavailableError) throw error;
      this.resetWorkerState();
      this.client.setRegistry(this.projectId, registry);
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
      this.resetWorkerState();
      const documentVersion = await this.sync(project, currentFileContent, true);
      const recoveredRequest = { ...request, documentVersion };
      const response = await this.client.request(recoveredRequest);
      await this.refreshDebugState();
      return response;
    }
  }

  private resetWorkerState(): void {
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
    this.client.cancelProject(this.projectId, 'TypeScript worker unavailable; using the main thread.');
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
