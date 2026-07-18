/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import esbuildWasmAssetURL from 'esbuild-wasm/esbuild.wasm?url';

import {
  isBrowserPreviewWorkerResponse,
  LIGHT_EXTENSION_BROWSER_PREVIEW_PROTOCOL_VERSION,
  type BrowserPreviewEntryContract,
  type BrowserPreviewFailureCode,
  type BrowserPreviewFile,
  type BrowserPreviewFileChange,
  type BrowserPreviewMetrics,
  type BrowserPreviewWorkerRequest,
  type BrowserPreviewWorkerResponse,
  type ProvisionalCompileResult,
} from './protocol';

interface BrowserPreviewWorkerLike {
  addEventListener(type: 'error', listener: (event: ErrorEvent) => void): void;
  addEventListener(type: 'message', listener: (event: MessageEvent<BrowserPreviewWorkerResponse>) => void): void;
  postMessage(message: BrowserPreviewWorkerRequest): void;
  terminate(): void;
}

export type BrowserPreviewWorkerFactory = () => BrowserPreviewWorkerLike;

type PendingRequest = {
  reject: (error: BrowserPreviewSessionError) => void;
  resolve: (response: BrowserPreviewWorkerResponse) => void;
};

type BrowserPreviewClientRequest = BrowserPreviewWorkerRequest extends infer Request
  ? Request extends BrowserPreviewWorkerRequest
    ? Omit<Request, 'protocolVersion' | 'requestId'>
    : never
  : never;

type BrowserPreviewGlobals = typeof globalThis & {
  __NOCOBASE_LIGHT_EXTENSION_BROWSER_PREVIEW__?: boolean;
  __NOCOBASE_LIGHT_EXTENSION_PREVIEW_WORKER_URL__?: string;
  __NOCOBASE_LIGHT_EXTENSION_PREVIEW_WASM_URL__?: string;
  __NOCOBASE_LIGHT_EXTENSION_PREVIEW_METRICS__?: (metrics: BrowserPreviewMetrics) => void;
};

const DEFAULT_IDLE_TIMEOUT_MS = 5 * 60 * 1000;

export class BrowserPreviewSessionError extends Error {
  constructor(
    readonly code: BrowserPreviewFailureCode,
    message: string,
    readonly recoverable = true,
  ) {
    super(message);
    this.name = 'BrowserPreviewSessionError';
  }
}

export class BrowserPreviewSession {
  private worker: BrowserPreviewWorkerLike | null = null;
  private pending = new Map<string, PendingRequest>();
  private requestSequence = 0;
  private initialized = false;
  private disposed = false;
  private workspaceVersion = 0;
  private snapshot: BrowserPreviewFile[] = [];
  private latestBuildRequestId: string | null = null;
  private workerRestartCount = 0;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly factory: BrowserPreviewWorkerFactory = defaultWorkerFactory,
    private readonly wasmURL = resolveBrowserPreviewWasmUrl(),
    private readonly idleTimeoutMs = DEFAULT_IDLE_TIMEOUT_MS,
  ) {}

  get version(): number {
    return this.workspaceVersion;
  }

  get restartCount(): number {
    return this.workerRestartCount;
  }

  async syncWorkspace(files: BrowserPreviewFile[]): Promise<number> {
    this.assertUsable();
    const normalizedFiles = normalizeFiles(files);
    const changes = buildWorkspaceDelta(this.snapshot, normalizedFiles);
    if (this.snapshot.length > 0 && changes.length === 0) {
      this.touchIdleTimer();
      return this.workspaceVersion;
    }

    await this.ensureInitialized();
    this.workspaceVersion += 1;
    const request =
      this.snapshot.length === 0
        ? {
            type: 'replaceWorkspace' as const,
            workspaceVersion: this.workspaceVersion,
            files: normalizedFiles,
          }
        : {
            type: 'applyDelta' as const,
            workspaceVersion: this.workspaceVersion,
            changes,
          };
    try {
      const response = await this.request(request);
      if (response.type !== 'workspaceUpdated' || response.workspaceVersion !== this.workspaceVersion) {
        throw new BrowserPreviewSessionError(
          'PREVIEW_WORKSPACE_VERSION_INVALID',
          'Provisional preview worker acknowledged an unexpected workspace version',
        );
      }
      this.snapshot = normalizedFiles;
      return this.workspaceVersion;
    } catch (error) {
      if (!this.canRecover(error)) {
        throw error;
      }
      await this.restartAndReplay(normalizedFiles);
      return this.workspaceVersion;
    }
  }

  async build(entry: BrowserPreviewEntryContract): Promise<ProvisionalCompileResult | null> {
    this.assertUsable();
    await this.ensureInitialized();
    if (this.workspaceVersion === 0) {
      throw new BrowserPreviewSessionError(
        'PREVIEW_WORKSPACE_VERSION_INVALID',
        'Provisional preview workspace has not been synchronized',
      );
    }

    const expectedVersion = this.workspaceVersion;
    const requestId = this.nextRequestId('build');
    this.latestBuildRequestId = requestId;
    try {
      const response = await this.requestWithId(requestId, {
        type: 'build',
        workspaceVersion: expectedVersion,
        entry,
      });
      if (
        this.latestBuildRequestId !== requestId ||
        this.workspaceVersion !== expectedVersion ||
        response.type !== 'buildResult' ||
        response.workspaceVersion !== expectedVersion
      ) {
        return null;
      }
      const result = {
        ...response.result,
        metrics: { ...response.result.metrics, workerRestartCount: this.workerRestartCount },
      };
      reportMetrics(result.metrics);
      return result;
    } catch (error) {
      if (!this.canRecover(error) || this.workspaceVersion !== expectedVersion) {
        throw error;
      }
      await this.restartAndReplay(this.snapshot);
      return this.build(entry);
    }
  }

  async cancelLatestBuild(): Promise<void> {
    const targetRequestId = this.latestBuildRequestId;
    this.latestBuildRequestId = null;
    if (!targetRequestId || !this.worker) {
      return;
    }
    const response = await this.request({ type: 'cancel', targetRequestId });
    if (response.type !== 'cancelled') {
      throw new BrowserPreviewSessionError('PREVIEW_CANCELLED', 'Provisional preview worker did not cancel the build');
    }
  }

  dispose(): void {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    this.clearIdleTimer();
    this.terminateWorker('Provisional preview session was disposed');
    this.snapshot = [];
    this.workspaceVersion = 0;
    this.latestBuildRequestId = null;
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized && this.worker) {
      this.touchIdleTimer();
      return;
    }
    const shouldReplay = this.workspaceVersion > 0 && this.snapshot.length > 0;
    const response = await this.request({ type: 'initialize', wasmURL: this.wasmURL });
    if (response.type !== 'ready') {
      throw new BrowserPreviewSessionError(
        'PREVIEW_WASM_INITIALIZE_FAILED',
        'Provisional preview worker did not complete initialization',
      );
    }
    this.initialized = true;
    if (shouldReplay) {
      const replay = await this.request({
        type: 'replaceWorkspace',
        workspaceVersion: this.workspaceVersion,
        files: this.snapshot,
      });
      if (replay.type !== 'workspaceUpdated' || replay.workspaceVersion !== this.workspaceVersion) {
        throw new BrowserPreviewSessionError(
          'PREVIEW_WORKSPACE_VERSION_INVALID',
          'Provisional preview worker failed to replay the current workspace',
        );
      }
    }
    this.touchIdleTimer();
  }

  private async restartAndReplay(files: BrowserPreviewFile[]): Promise<void> {
    this.workerRestartCount += 1;
    this.terminateWorker('Restarting provisional preview worker after a crash');
    this.snapshot = normalizeFiles(files);
    await this.ensureInitialized();
  }

  private canRecover(error: unknown): boolean {
    return (
      this.workerRestartCount < 1 &&
      error instanceof BrowserPreviewSessionError &&
      error.code === 'PREVIEW_WORKER_CRASHED'
    );
  }

  private request(request: BrowserPreviewClientRequest): Promise<BrowserPreviewWorkerResponse> {
    return this.requestWithId(this.nextRequestId(request.type), request);
  }

  private requestWithId(
    requestId: string,
    request: BrowserPreviewClientRequest,
  ): Promise<BrowserPreviewWorkerResponse> {
    this.assertUsable();
    const worker = this.ensureWorker();
    const message = {
      ...request,
      protocolVersion: LIGHT_EXTENSION_BROWSER_PREVIEW_PROTOCOL_VERSION,
      requestId,
    } as BrowserPreviewWorkerRequest;
    this.touchIdleTimer();
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { reject, resolve });
      worker.postMessage(message);
    });
  }

  private ensureWorker(): BrowserPreviewWorkerLike {
    if (this.worker) {
      return this.worker;
    }
    let worker: BrowserPreviewWorkerLike;
    try {
      worker = this.factory();
    } catch (error) {
      throw new BrowserPreviewSessionError(
        'PREVIEW_WORKER_UNAVAILABLE',
        error instanceof Error ? error.message : 'Provisional preview worker is unavailable',
      );
    }
    worker.addEventListener('message', (event) => this.handleMessage(worker, event.data));
    worker.addEventListener('error', (event) => {
      if (this.worker !== worker) {
        return;
      }
      this.terminateWorker(event.message || 'Provisional preview worker crashed');
    });
    this.worker = worker;
    return worker;
  }

  private handleMessage(sourceWorker: BrowserPreviewWorkerLike, response: BrowserPreviewWorkerResponse): void {
    if (sourceWorker !== this.worker || !isBrowserPreviewWorkerResponse(response)) {
      return;
    }
    const pending = this.pending.get(response.requestId);
    if (!pending) {
      return;
    }
    this.pending.delete(response.requestId);
    if (response.type === 'error') {
      reportMetrics({
        workerRestartCount: this.workerRestartCount,
        ...workspaceStats(this.snapshot),
        previewFailureCode: response.code,
      });
      pending.reject(new BrowserPreviewSessionError(response.code, response.message, response.recoverable));
    } else {
      pending.resolve(response);
    }
  }

  private terminateWorker(reason: string): void {
    this.worker?.terminate();
    this.worker = null;
    this.initialized = false;
    const error = new BrowserPreviewSessionError('PREVIEW_WORKER_CRASHED', reason);
    for (const pending of this.pending.values()) {
      pending.reject(error);
    }
    this.pending.clear();
  }

  private touchIdleTimer(): void {
    this.clearIdleTimer();
    if (this.idleTimeoutMs <= 0) {
      return;
    }
    this.idleTimer = setTimeout(() => {
      this.terminateWorker('Provisional preview worker was released after being idle');
    }, this.idleTimeoutMs);
  }

  private clearIdleTimer(): void {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }

  private nextRequestId(operation: string): string {
    this.requestSequence += 1;
    return `${operation}-${this.requestSequence}`;
  }

  private assertUsable(): void {
    if (this.disposed) {
      throw new BrowserPreviewSessionError(
        'PREVIEW_WORKER_UNAVAILABLE',
        'Provisional preview session has been disposed',
        false,
      );
    }
  }
}

export function isBrowserProvisionalPreviewEnabled(): boolean {
  return (globalThis as BrowserPreviewGlobals).__NOCOBASE_LIGHT_EXTENSION_BROWSER_PREVIEW__ === true;
}

export function resolveBrowserPreviewWorkerUrl(): string | URL {
  return (
    (globalThis as BrowserPreviewGlobals).__NOCOBASE_LIGHT_EXTENSION_PREVIEW_WORKER_URL__ ||
    new URL('./browserPreview.worker.ts', import.meta.url)
  );
}

export function resolveBrowserPreviewWasmUrl(): string {
  const override = (globalThis as BrowserPreviewGlobals).__NOCOBASE_LIGHT_EXTENSION_PREVIEW_WASM_URL__;
  if (override) {
    return override;
  }
  if (typeof document !== 'undefined') {
    return new URL(esbuildWasmAssetURL, document.baseURI).toString();
  }
  return esbuildWasmAssetURL;
}

function defaultWorkerFactory(): BrowserPreviewWorkerLike {
  const override = (globalThis as BrowserPreviewGlobals).__NOCOBASE_LIGHT_EXTENSION_PREVIEW_WORKER_URL__;
  return override
    ? new Worker(override, { type: 'module' })
    : new Worker(new URL('./browserPreview.worker.ts', import.meta.url), { type: 'module' });
}

function normalizeFiles(files: BrowserPreviewFile[]): BrowserPreviewFile[] {
  return files
    .map((file) => ({ path: normalizePath(file.path), content: String(file.content || ''), language: file.language }))
    .sort((left, right) => left.path.localeCompare(right.path));
}

function normalizePath(path: string): string {
  return String(path || '')
    .replace(/\\/gu, '/')
    .replace(/^\/+|\/+$/gu, '')
    .replace(/\/+/gu, '/');
}

export function buildWorkspaceDelta(
  previous: BrowserPreviewFile[],
  next: BrowserPreviewFile[],
): BrowserPreviewFileChange[] {
  const previousByPath = new Map(previous.map((file) => [file.path, file]));
  const nextByPath = new Map(next.map((file) => [file.path, file]));
  const removed = previous.filter((file) => !nextByPath.has(file.path));
  const added = next.filter((file) => !previousByPath.has(file.path));
  const changes: BrowserPreviewFileChange[] = [];
  const consumedAddedPaths = new Set<string>();

  for (const file of removed) {
    const renamed = added.find(
      (candidate) =>
        !consumedAddedPaths.has(candidate.path) &&
        candidate.content === file.content &&
        candidate.language === file.language,
    );
    if (renamed) {
      consumedAddedPaths.add(renamed.path);
      changes.push({ operation: 'rename', path: file.path, nextPath: renamed.path });
    } else {
      changes.push({ operation: 'delete', path: file.path });
    }
  }
  for (const file of next) {
    const previousFile = previousByPath.get(file.path);
    if (consumedAddedPaths.has(file.path)) {
      continue;
    }
    if (!previousFile || previousFile.content !== file.content || previousFile.language !== file.language) {
      changes.push({ operation: 'upsert', file });
    }
  }

  return changes.sort((left, right) => changePath(left).localeCompare(changePath(right)));
}

function changePath(change: BrowserPreviewFileChange): string {
  return change.operation === 'upsert' ? change.file.path : change.path;
}

function reportMetrics(metrics: BrowserPreviewMetrics): void {
  try {
    (globalThis as BrowserPreviewGlobals).__NOCOBASE_LIGHT_EXTENSION_PREVIEW_METRICS__?.(metrics);
  } catch {
    // Telemetry observers must not affect provisional preview behavior.
  }
}

function workspaceStats(
  files: BrowserPreviewFile[],
): Pick<BrowserPreviewMetrics, 'inputFileCount' | 'inputBytes' | 'estimatedMemoryBytes'> {
  const encoder = new TextEncoder();
  const inputBytes = files.reduce(
    (total, file) => total + encoder.encode(file.path).byteLength + encoder.encode(file.content).byteLength,
    0,
  );
  return {
    inputFileCount: files.length,
    inputBytes,
    estimatedMemoryBytes: inputBytes * 2,
  };
}
