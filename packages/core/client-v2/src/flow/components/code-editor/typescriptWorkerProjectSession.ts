/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Completion, CompletionResult } from '@codemirror/autocomplete';
import type { RunJSTypeLibraryRequest } from '@nocobase/runjs/client-v2';

import { getDefaultRunJSTypeLibraryRegistry, type RunJSTypeLibraryRegistry } from './typescriptLibraryRegistry';
import type { RunJSTypeScriptMetrics } from './typescriptMetrics';
import { ensureGeneratedRunJSTypeLibraryPackLoadersRegistered } from './type-packs';
import type {
  CodeEditorTypeScriptProject,
  CodeEditorTypeScriptProjectDebugState,
  CodeEditorTypeScriptDiagnostic,
  CodeEditorTypeScriptProjectInternalError,
  CodeEditorTypeScriptProjectSession,
} from './typescriptProject';
import {
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

type TypeScriptWorkerClientRequest = TypeScriptWorkerRequest extends infer Request
  ? Request extends TypeScriptWorkerRequest
    ? Omit<Request, 'protocolVersion' | 'requestId'>
    : never
  : never;

type TypeScriptWorkerOperationRequest = Extract<
  TypeScriptWorkerClientRequest,
  { kind: 'completion' | 'diagnostics' | 'hover' }
>;

export function resolveTypeScriptWorkerUrl(): string | URL {
  const overrideUrl = (globalThis as { __NOCOBASE_RUNJS_TYPESCRIPT_WORKER_URL__?: string })
    .__NOCOBASE_RUNJS_TYPESCRIPT_WORKER_URL__;
  return overrideUrl || new URL('./typescriptProject.worker.ts', import.meta.url);
}

function defaultWorkerFactory(): WorkerLike {
  const overrideUrl = (globalThis as { __NOCOBASE_RUNJS_TYPESCRIPT_WORKER_URL__?: string })
    .__NOCOBASE_RUNJS_TYPESCRIPT_WORKER_URL__;
  if (overrideUrl) {
    return new Worker(overrideUrl, { type: 'module' });
  }
  return new Worker(new URL('./typescriptProject.worker.ts', import.meta.url), { type: 'module' });
}

function projectSnapshot(
  project: CodeEditorTypeScriptProject,
  currentFileContent?: string,
): TypeScriptWorkerProjectSnapshot {
  ensureGeneratedRunJSTypeLibraryPackLoadersRegistered();
  const registry = project.typeLibraryRegistry || getDefaultRunJSTypeLibraryRegistry();
  const currentPath = normalizePath(project.currentFilePath);
  const files = (project.files || []).map((file) => ({ content: file.content, path: normalizePath(file.path) }));
  if (typeof currentFileContent === 'string') {
    const current = files.find((file) => file.path === currentPath);
    if (current) current.content = currentFileContent;
    else files.push({ content: currentFileContent, path: currentPath });
  }
  return {
    compilerOptions: project.compilerOptions as Record<string, unknown> | undefined,
    currentFilePath: currentPath,
    declarationFiles: (project.declarationFiles || []).map((file) => ({
      content: file.content,
      path: normalizePath(file.path),
    })),
    files,
    registryKey: registry.getCacheKey(),
    runJSContext: project.runJSContext,
    typeLibraryIds: [...(project.typeLibraryIds || [])],
    typeLibraryUsageDefinitions: registry.getUsageDefinitions(),
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

function snapshotKey(snapshot: TypeScriptWorkerProjectSnapshot): string {
  return JSON.stringify(snapshot);
}

function fileDelta(
  previous: readonly { content: string; path: string }[],
  next: readonly { content: string; path: string }[],
): { removals: string[]; upserts: Array<{ content: string; path: string }> } {
  const previousFiles = new Map(previous.map((file) => [file.path, file.content]));
  const nextFiles = new Map(next.map((file) => [file.path, file.content]));
  return {
    removals: [...previousFiles.keys()].filter((path) => !nextFiles.has(path)),
    upserts: next.filter((file) => previousFiles.get(file.path) !== file.content),
  };
}

function projectUpdate(
  previous: TypeScriptWorkerProjectSnapshot,
  next: TypeScriptWorkerProjectSnapshot,
): TypeScriptWorkerProjectUpdate {
  const files = fileDelta(previous.files, next.files);
  const declarations = fileDelta(previous.declarationFiles, next.declarationFiles);
  return {
    compilerOptions: next.compilerOptions,
    currentFilePath: next.currentFilePath,
    declarationFileRemovals: declarations.removals,
    declarationFileUpserts: declarations.upserts,
    fileRemovals: files.removals,
    fileUpserts: files.upserts,
    registryKey: next.registryKey,
    runJSContext: next.runJSContext,
    typeLibraryIds: next.typeLibraryIds,
    typeLibraryUsageDefinitions: next.typeLibraryUsageDefinitions,
  };
}

function toCompletion(entry: TypeScriptWorkerCompletionEntry): Completion {
  return {
    apply(view, _completion, from, to) {
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
  private metrics: RunJSTypeScriptMetrics | undefined;

  constructor(private readonly factory: TypeScriptWorkerFactory) {}

  setRegistry(registry: RunJSTypeLibraryRegistry, metrics?: RunJSTypeScriptMetrics): void {
    this.registry = registry;
    this.metrics = metrics;
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
    this.worker?.terminate();
    this.worker = null;
    this.registry = null;
    this.metrics = undefined;
    const error = new Error(reason);
    for (const pending of this.pending.values()) pending.reject(error);
    this.pending.clear();
  }

  private ensureWorker(): WorkerLike {
    if (this.worker) return this.worker;
    const worker = this.factory();
    worker.addEventListener('message', (event) => this.onMessage(worker, event.data));
    worker.addEventListener('error', (event) => {
      if (this.worker === worker) this.reset(event.message || 'TypeScript worker crashed.');
    });
    this.worker = worker;
    return worker;
  }

  private onMessage(sourceWorker: WorkerLike, message: TypeScriptWorkerOutgoingMessage): void {
    if (!isTypeScriptWorkerProtocolMessage(message)) return;
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
      const registry = this.registry;
      const metrics = this.metrics;
      if (!registry) throw new Error('TypeScript worker registry is no longer available.');
      metrics?.recordPackRequests([message.request.packId]);
      response.pack = await registry.loadPackForWorker(
        message.request as RunJSTypeLibraryRequest,
        metrics?.createLibraryLoadObserver(),
      );
      metrics?.recordPreparedPacks([response.pack]);
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
  private lastSnapshot: TypeScriptWorkerProjectSnapshot | null = null;
  private latestRequestIds = new Map<'completion' | 'diagnostics' | 'hover', number>();
  private requestSequence = 0;
  private stateKey = '';
  private workerCacheHitCursor = 0;
  private workerPackRequestCursor = 0;

  constructor(factory: TypeScriptWorkerFactory = defaultWorkerFactory) {
    this.client = new TypeScriptWorkerClient(factory);
  }

  async getCompletionResult(
    project: CodeEditorTypeScriptProject,
    position: number,
    currentFileContent?: string,
    explicit = false,
  ): Promise<CompletionResult | null> {
    const startedAt = project.metrics?.now();
    const requestId = this.begin('completion');
    try {
      await this.sync(project, currentFileContent);
      const response = await this.requestWithRecovery(project, currentFileContent, {
        documentVersion: this.documentVersion,
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
      this.report(project, error);
      return null;
    } finally {
      if (typeof startedAt === 'number') project.metrics?.recordDuration('completion', startedAt);
    }
  }

  async getDiagnostics(
    project: CodeEditorTypeScriptProject,
    currentFileContent?: string,
  ): Promise<CodeEditorTypeScriptDiagnostic[]> {
    const startedAt = project.metrics?.now();
    const requestId = this.begin('diagnostics');
    try {
      await this.sync(project, currentFileContent);
      const response = await this.requestWithRecovery(project, currentFileContent, {
        documentVersion: this.documentVersion,
        kind: 'diagnostics',
        projectId: this.projectId,
      });
      if (!this.isCurrentResponse('diagnostics', requestId, response) || response.kind !== 'diagnostics-result')
        return [];
      return response.result;
    } catch (error: unknown) {
      this.report(project, error);
      return [];
    } finally {
      if (typeof startedAt === 'number') project.metrics?.recordDuration('diagnostics', startedAt);
    }
  }

  async getHover(project: CodeEditorTypeScriptProject, position: number, currentFileContent?: string) {
    const startedAt = project.metrics?.now();
    const requestId = this.begin('hover');
    try {
      await this.sync(project, currentFileContent);
      const response = await this.requestWithRecovery(project, currentFileContent, {
        documentVersion: this.documentVersion,
        kind: 'hover',
        position,
        projectId: this.projectId,
      });
      if (!this.isCurrentResponse('hover', requestId, response) || response.kind !== 'hover-result') return null;
      return response.result;
    } catch (error: unknown) {
      this.report(project, error);
      return null;
    } finally {
      if (typeof startedAt === 'number') project.metrics?.recordDuration('hover', startedAt);
    }
  }

  getDebugState(): CodeEditorTypeScriptProjectDebugState {
    return this.lastDebugState;
  }

  getLastInternalError(): CodeEditorTypeScriptProjectInternalError | null {
    return this.lastInternalError;
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.client
      .request({
        documentVersion: this.documentVersion,
        kind: 'dispose',
        projectId: this.projectId,
      })
      .then(() => this.client.reset())
      .catch(() => this.client.reset());
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

  private begin(kind: 'completion' | 'diagnostics' | 'hover'): number {
    const id = ++this.requestSequence;
    this.latestRequestIds.set(kind, id);
    return id;
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

  private async sync(project: CodeEditorTypeScriptProject, currentFileContent?: string, force = false): Promise<void> {
    if (this.disposed) throw new Error('TypeScript project session has been disposed.');
    const registry = project.typeLibraryRegistry || getDefaultRunJSTypeLibraryRegistry();
    const snapshot = projectSnapshot(project, currentFileContent);
    const key = snapshotKey(snapshot);
    this.client.setRegistry(registry, project.metrics);
    if (!force && key === this.stateKey) return;
    this.stateKey = key;
    this.documentVersion += 1;
    const previousSnapshot = this.lastSnapshot;
    try {
      const response = await this.client.request({
        documentVersion: this.documentVersion,
        kind: 'sync',
        projectId: this.projectId,
        ...(force || !previousSnapshot ? { snapshot } : { update: projectUpdate(previousSnapshot, snapshot) }),
      });
      if (response.kind !== 'synced') throw new Error('TypeScript worker did not acknowledge project synchronization.');
      this.lastSnapshot = snapshot;
    } catch (error: unknown) {
      if (force) throw error;
      this.resetWorkerState('Rebuilding TypeScript worker after synchronization failure.');
      await this.sync(project, currentFileContent, true);
    }
  }

  private async requestWithRecovery(
    project: CodeEditorTypeScriptProject,
    currentFileContent: string | undefined,
    request: TypeScriptWorkerOperationRequest,
  ): Promise<TypeScriptWorkerResponse> {
    try {
      const response = await this.client.request(request);
      await this.refreshDebugState(project.metrics);
      return response;
    } catch (_) {
      this.resetWorkerState('Rebuilding TypeScript worker after failure.');
      await this.sync(project, currentFileContent, true);
      const recoveredRequest = { ...request, documentVersion: this.documentVersion };
      const response = await this.client.request(recoveredRequest);
      await this.refreshDebugState(project.metrics);
      return response;
    }
  }

  private resetWorkerState(reason: string): void {
    this.client.reset(reason);
    this.stateKey = '';
    this.lastSnapshot = null;
    this.workerCacheHitCursor = 0;
    this.workerPackRequestCursor = 0;
    this.lastDebugState = { ...this.lastDebugState, languageServiceCreationCount: 0 };
  }

  private async refreshDebugState(metrics?: RunJSTypeScriptMetrics): Promise<void> {
    const response = await this.client.request({
      documentVersion: this.documentVersion,
      kind: 'debug',
      projectId: this.projectId,
    });
    if (response.kind !== 'debug-result') return;
    const previousCreationCount = this.lastDebugState.languageServiceCreationCount;
    this.lastDebugState = response.result as TypeScriptWorkerDebugState;
    const workerDebug = response.result as TypeScriptWorkerDebugState;
    const languageServiceCreationCount = Math.max(0, workerDebug.languageServiceCreationCount - previousCreationCount);
    const cacheHitIds = workerDebug.cacheHitIds.slice(this.workerCacheHitCursor);
    const packRequestIds = workerDebug.packRequestIds.slice(this.workerPackRequestCursor);
    this.workerCacheHitCursor = workerDebug.cacheHitIds.length;
    this.workerPackRequestCursor = workerDebug.packRequestIds.length;
    metrics?.recordWorkerState({
      cacheHitIds,
      dependencyFileCount: workerDebug.dependencyFileCount,
      immutableCacheCharacterCount: workerDebug.immutableCacheCharacterCount,
      immutableCacheFileCount: workerDebug.immutableFileCount,
      languageServiceCreationCount,
      languageServiceRebuildCount: previousCreationCount > 0 ? languageServiceCreationCount : 0,
      packRequestIds,
      peakDeclarationCharacterCount: workerDebug.peakDeclarationCharacterCount,
      programSourceFileCount: workerDebug.programSourceFileCount,
    });
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
}

export function canUseTypeScriptWorker(): boolean {
  const forced = (globalThis as { __NOCOBASE_RUNJS_TYPESCRIPT_WORKER__?: boolean })
    .__NOCOBASE_RUNJS_TYPESCRIPT_WORKER__;
  return (
    typeof window !== 'undefined' &&
    typeof Worker !== 'undefined' &&
    (forced === true || process.env.NODE_ENV !== 'test')
  );
}
