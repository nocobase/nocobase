/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizePath, sha256Hex, stableSerialize, type RunJSCompileFile } from '@nocobase/runjs';
import {
  buildRunJSCompilerSessionIdentity,
  compileRunJSSourceWorkspace,
  RunJSEntryCompilerSession,
  type CompileRunJSSourceWorkspaceInput,
  type CompileRunJSSourceWorkspaceResult,
  type RunJSCompilerSessionContract,
  type RunJSCompilerSessionIdentity,
  type RunJSCompilerSessionMetric,
  type RunJSEntryCompilerSessionDebugState,
} from '@nocobase/runjs/compiler';

import type { CompileInputManifest } from './LightExtensionCompileKey';
import { LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY } from './LightExtensionCompileContract';

export type LightExtensionCompilerSessionEvictionReason =
  | 'lru'
  | 'ttl'
  | 'build_changed'
  | 'error'
  | 'shutdown'
  | 'repo_deleted';

export type LightExtensionCompilerSessionMetricName =
  | 'compile.session.hit'
  | 'compile.session.miss'
  | 'compile.session.recreate'
  | 'compile.session.eviction'
  | 'compile.session.active_repos'
  | 'compile.session.active_entries'
  | 'compile.session.estimated_file_bytes'
  | 'compile.entry.esbuild.rebuild'
  | 'compile.entry.typescript.incremental'
  | 'compile.entry.cold_fallback';

export interface LightExtensionCompilerSessionMetric {
  name: LightExtensionCompilerSessionMetricName;
  value: number;
  durationMs?: number;
  reason?: LightExtensionCompilerSessionEvictionReason;
  reused?: boolean;
}

export type LightExtensionCompilerSessionMetricObserver = (metric: LightExtensionCompilerSessionMetric) => void;

export interface LightExtensionCompilerSessionLike {
  compile(input: CompileRunJSSourceWorkspaceInput): Promise<CompileRunJSSourceWorkspaceResult>;
  dispose(): Promise<void>;
  getDebugState(): RunJSEntryCompilerSessionDebugState;
}

export interface LightExtensionCompilerSessionManagerOptions {
  maxRepos?: number;
  maxEntries?: number;
  maxEstimatedFileBytes?: number;
  idleTtlMs?: number;
  sweepIntervalMs?: number;
  now?: () => number;
  metricObserver?: LightExtensionCompilerSessionMetricObserver;
  coldCompile?: (input: CompileRunJSSourceWorkspaceInput) => Promise<CompileRunJSSourceWorkspaceResult>;
  createSession?: (input: {
    identity: RunJSCompilerSessionIdentity;
    metricObserver: (metric: RunJSCompilerSessionMetric) => void;
  }) => LightExtensionCompilerSessionLike;
}

export interface LightExtensionCompilerSessionCompileRequest {
  contract: RunJSCompilerSessionContract;
  input: CompileRunJSSourceWorkspaceInput;
  workspaceUpdate?: 'replace' | 'delta';
}

export interface LightExtensionCompilerSessionCompileResult {
  result: CompileRunJSSourceWorkspaceResult;
  execution: 'session' | 'cold' | 'cold-fallback';
  sessionKey?: string;
}

export interface RepoCompilerSessionContainerDebugState {
  repoId: string;
  fileCount: number;
  fileBytes: number;
  fileVersions: Record<string, number>;
  entrySessionCount: number;
  lastAccessAt: number;
  lastAccessSequence: number;
}

interface CanonicalRepoFile {
  path: string;
  content: string;
  language?: string;
  version: number;
  bytes: number;
}

interface EntrySessionRecord {
  identity: RunJSCompilerSessionIdentity;
  session: LightExtensionCompilerSessionLike;
  lastAccessAt: number;
  lastAccessSequence: number;
  activeCompileCount: number;
}

const defaultMaxRepos = 32;
const defaultMaxEntries = 128;
const defaultMaxEstimatedFileBytes = 128 * 1024 * 1024;
const defaultIdleTtlMs = 10 * 60 * 1000;
const defaultSweepIntervalMs = 60 * 1000;

export class RepoCompilerSessionContainer {
  readonly entrySessions = new Map<string, EntrySessionRecord>();

  private readonly files = new Map<string, CanonicalRepoFile>();

  private readonly historicalVersions = new Map<string, number>();

  private fileBytes = 0;

  lastAccessAt: number;

  lastAccessSequence: number;

  constructor(
    readonly repoId: string,
    now: number,
    accessSequence: number,
  ) {
    this.lastAccessAt = now;
    this.lastAccessSequence = accessSequence;
  }

  updateWorkspace(files: readonly RunJSCompileFile[], mode: 'replace' | 'delta'): void {
    const next = mode === 'delta' ? new Map(this.files) : new Map<string, CanonicalRepoFile>();
    for (const file of files) {
      const path = normalizePath(file.path);
      if (file.operation === 'delete') {
        next.delete(path);
        continue;
      }
      if (typeof file.content !== 'string') {
        continue;
      }
      const current = this.files.get(path);
      const unchanged = current && current.content === file.content && current.language === file.language;
      const version = unchanged ? current.version : (this.historicalVersions.get(path) || 0) + 1;
      this.historicalVersions.set(path, version);
      next.set(path, {
        path,
        content: file.content,
        language: file.language,
        version,
        bytes: Buffer.byteLength(path, 'utf8') + Buffer.byteLength(file.content, 'utf8'),
      });
    }
    this.files.clear();
    this.fileBytes = 0;
    for (const [path, file] of next) {
      this.files.set(path, file);
      this.fileBytes += file.bytes;
    }
  }

  compileFiles(): RunJSCompileFile[] {
    return [...this.files.values()]
      .sort((left, right) => left.path.localeCompare(right.path))
      .map(({ path, content, language }) => {
        const file: RunJSCompileFile = { path, content };
        if (language !== undefined) {
          file.language = language;
        }
        return file;
      });
  }

  getFileBytes(): number {
    return this.fileBytes;
  }

  getDebugState(): RepoCompilerSessionContainerDebugState {
    return {
      repoId: this.repoId,
      fileCount: this.files.size,
      fileBytes: this.fileBytes,
      fileVersions: Object.fromEntries(
        [...this.historicalVersions.entries()].sort(([left], [right]) => left.localeCompare(right)),
      ),
      entrySessionCount: this.entrySessions.size,
      lastAccessAt: this.lastAccessAt,
      lastAccessSequence: this.lastAccessSequence,
    };
  }
}

export class LightExtensionCompilerSessionManager {
  private readonly maxRepos: number;

  private readonly maxEntries: number;

  private readonly maxEstimatedFileBytes: number;

  private readonly idleTtlMs: number;

  private readonly now: () => number;

  private readonly metricObserver?: LightExtensionCompilerSessionMetricObserver;

  private readonly coldCompile: (input: CompileRunJSSourceWorkspaceInput) => Promise<CompileRunJSSourceWorkspaceResult>;

  private readonly createSession: NonNullable<LightExtensionCompilerSessionManagerOptions['createSession']>;

  private readonly repos = new Map<string, RepoCompilerSessionContainer>();

  private readonly pendingDisposals = new Set<Promise<void>>();

  private readonly sweepTimer?: ReturnType<typeof setInterval>;

  private accessSequence = 0;

  private compilerBuildId?: string;

  private disposed = false;

  private disposePromise?: Promise<void>;

  constructor(options: LightExtensionCompilerSessionManagerOptions = {}) {
    this.maxRepos = normalizeLimit(options.maxRepos, defaultMaxRepos);
    this.maxEntries = normalizeLimit(options.maxEntries, defaultMaxEntries);
    this.maxEstimatedFileBytes = normalizeLimit(options.maxEstimatedFileBytes, defaultMaxEstimatedFileBytes);
    this.idleTtlMs = normalizeLimit(options.idleTtlMs, defaultIdleTtlMs);
    this.now = options.now || Date.now;
    this.metricObserver = options.metricObserver;
    this.coldCompile = options.coldCompile || compileRunJSSourceWorkspace;
    this.createSession =
      options.createSession ||
      ((input) =>
        new RunJSEntryCompilerSession({
          entryPath: input.identity.contract.entryPath,
          contractFingerprint: input.identity.contractFingerprint,
          metricObserver: input.metricObserver,
        }));
    const sweepIntervalMs = normalizeLimit(options.sweepIntervalMs, defaultSweepIntervalMs);
    if (sweepIntervalMs > 0 && this.idleTtlMs > 0) {
      this.sweepTimer = setInterval(() => {
        this.sweepExpired().catch(() => undefined);
      }, sweepIntervalMs);
      this.sweepTimer.unref?.();
    }
  }

  async compile(
    request: LightExtensionCompilerSessionCompileRequest,
  ): Promise<LightExtensionCompilerSessionCompileResult> {
    this.assertActive();
    const identity = buildRunJSCompilerSessionIdentity(request.contract);
    assertCompileInputMatchesContract(request.input, identity.contract);
    await this.ensureCompilerBuild(identity.contract.compilerBuildId);
    await this.sweepExpired();
    if (this.maxRepos === 0 || this.maxEntries === 0 || this.maxEstimatedFileBytes === 0) {
      this.emit({ name: 'compile.session.miss', value: 1 });
      const result = await this.coldCompile(request.input);
      this.emitGauges();
      return { result, execution: 'cold' };
    }

    const now = this.now();
    const repo = await this.getOrCreateRepo(identity.contract.repoId, now);
    repo.updateWorkspace(request.input.files, request.workspaceUpdate || 'replace');
    this.touchRepo(repo, now);
    const compileInput = { ...request.input, files: repo.compileFiles() };
    let record = repo.entrySessions.get(identity.key);
    if (record) {
      this.emit({ name: 'compile.session.hit', value: 1 });
    } else {
      const replaced = [...repo.entrySessions.values()].filter(
        (item) => item.identity.contract.entryIdentity === identity.contract.entryIdentity,
      );
      for (const item of replaced) {
        this.evictEntry(repo, item, 'build_changed');
      }
      if (replaced.length > 0) {
        this.emit({ name: 'compile.session.recreate', value: 1 });
      } else {
        this.emit({ name: 'compile.session.miss', value: 1 });
      }
      record = {
        identity,
        session: this.createSession({
          identity,
          metricObserver: (metric) => this.emitCoreMetric(metric),
        }),
        lastAccessAt: now,
        lastAccessSequence: this.nextAccessSequence(),
        activeCompileCount: 0,
      };
      repo.entrySessions.set(identity.key, record);
      await this.enforceCapacity(identity.key);
    }

    this.touchEntry(repo, record, now);
    record.activeCompileCount += 1;
    try {
      const result = await record.session.compile(compileInput);
      return { result, execution: 'session', sessionKey: identity.key };
    } catch (error) {
      this.evictEntry(repo, record, 'error');
      const startedAt = this.now();
      const result = await this.coldCompile(compileInput);
      this.emit({
        name: 'compile.entry.cold_fallback',
        value: 1,
        durationMs: Math.max(0, this.now() - startedAt),
      });
      return { result, execution: 'cold-fallback' };
    } finally {
      record.activeCompileCount = Math.max(0, record.activeCompileCount - 1);
      await this.enforceCapacity();
      this.emitGauges();
    }
  }

  async sweepExpired(): Promise<number> {
    if (this.disposed || this.idleTtlMs === 0) {
      return 0;
    }
    const cutoff = this.now() - this.idleTtlMs;
    let evicted = 0;
    for (const repo of [...this.repos.values()]) {
      for (const record of [...repo.entrySessions.values()]) {
        if (record.activeCompileCount === 0 && record.lastAccessAt <= cutoff) {
          this.evictEntry(repo, record, 'ttl');
          evicted += 1;
        }
      }
      if (repo.entrySessions.size === 0 && repo.lastAccessAt <= cutoff) {
        this.repos.delete(repo.repoId);
      }
    }
    this.emitGauges();
    return evicted;
  }

  async disposeRepo(repoId: string): Promise<void> {
    const repo = this.repos.get(String(repoId));
    if (!repo) {
      return;
    }
    this.repos.delete(repo.repoId);
    for (const record of [...repo.entrySessions.values()]) {
      this.evictEntry(repo, record, 'repo_deleted');
    }
    await this.waitForPendingDisposals();
    this.emitGauges();
  }

  getDebugState(): {
    disposed: boolean;
    compilerBuildId?: string;
    activeRepos: number;
    activeEntries: number;
    estimatedFileBytes: number;
    repos: RepoCompilerSessionContainerDebugState[];
  } {
    return {
      disposed: this.disposed,
      compilerBuildId: this.compilerBuildId,
      activeRepos: this.repos.size,
      activeEntries: this.activeEntryCount(),
      estimatedFileBytes: this.estimatedFileBytes(),
      repos: [...this.repos.values()]
        .sort((left, right) => left.repoId.localeCompare(right.repoId))
        .map((repo) => repo.getDebugState()),
    };
  }

  dispose(): Promise<void> {
    if (this.disposePromise) {
      return this.disposePromise;
    }
    this.disposed = true;
    if (this.sweepTimer) {
      clearInterval(this.sweepTimer);
    }
    for (const repo of [...this.repos.values()]) {
      for (const record of [...repo.entrySessions.values()]) {
        this.evictEntry(repo, record, 'shutdown');
      }
    }
    this.repos.clear();
    this.disposePromise = this.waitForPendingDisposals().then(() => {
      this.emitGauges();
    });
    return this.disposePromise;
  }

  private async ensureCompilerBuild(compilerBuildId: string): Promise<void> {
    if (!this.compilerBuildId) {
      this.compilerBuildId = compilerBuildId;
      return;
    }
    if (this.compilerBuildId === compilerBuildId) {
      return;
    }
    this.compilerBuildId = compilerBuildId;
    for (const repo of [...this.repos.values()]) {
      for (const record of [...repo.entrySessions.values()]) {
        this.evictEntry(repo, record, 'build_changed');
      }
    }
    this.repos.clear();
    await this.waitForPendingDisposals();
  }

  private async getOrCreateRepo(repoId: string, now: number): Promise<RepoCompilerSessionContainer> {
    const existing = this.repos.get(repoId);
    if (existing) {
      return existing;
    }
    if (this.maxRepos > 0 && this.repos.size >= this.maxRepos) {
      const candidate = this.oldestRepo();
      if (candidate) {
        this.repos.delete(candidate.repoId);
        for (const record of [...candidate.entrySessions.values()]) {
          this.evictEntry(candidate, record, 'lru');
        }
      }
    }
    const repo = new RepoCompilerSessionContainer(repoId, now, this.nextAccessSequence());
    this.repos.set(repoId, repo);
    return repo;
  }

  private oldestRepo(): RepoCompilerSessionContainer | undefined {
    return [...this.repos.values()]
      .filter((repo) => [...repo.entrySessions.values()].every((record) => record.activeCompileCount === 0))
      .sort(compareRepoLru)[0];
  }

  private async enforceCapacity(protectedSessionKey?: string): Promise<void> {
    while (
      this.activeEntryCount() > this.maxEntries ||
      this.repos.size > this.maxRepos ||
      this.estimatedFileBytes() > this.maxEstimatedFileBytes
    ) {
      const candidate = this.oldestEntry(protectedSessionKey);
      if (!candidate) {
        const emptyRepo = this.oldestEmptyRepo();
        if (emptyRepo && (this.repos.size > this.maxRepos || this.estimatedFileBytes() > this.maxEstimatedFileBytes)) {
          this.repos.delete(emptyRepo.repoId);
          continue;
        }
        break;
      }
      this.evictEntry(candidate.repo, candidate.record, 'lru');
    }
    for (const repo of [...this.repos.values()]) {
      if (repo.entrySessions.size === 0 && this.repos.size > this.maxRepos) {
        this.repos.delete(repo.repoId);
      }
    }
    await Promise.resolve();
  }

  private oldestEmptyRepo(): RepoCompilerSessionContainer | undefined {
    return [...this.repos.values()].filter((repo) => repo.entrySessions.size === 0).sort(compareRepoLru)[0];
  }

  private oldestEntry(
    protectedSessionKey?: string,
  ): { repo: RepoCompilerSessionContainer; record: EntrySessionRecord } | undefined {
    return [...this.repos.values()]
      .flatMap((repo) => [...repo.entrySessions.values()].map((record) => ({ repo, record })))
      .filter(({ record }) => record.activeCompileCount === 0 && record.identity.key !== protectedSessionKey)
      .sort((left, right) => compareEntryLru(left.record, right.record))[0];
  }

  private evictEntry(
    repo: RepoCompilerSessionContainer,
    record: EntrySessionRecord,
    reason: LightExtensionCompilerSessionEvictionReason,
  ): void {
    if (repo.entrySessions.get(record.identity.key) !== record) {
      return;
    }
    repo.entrySessions.delete(record.identity.key);
    this.emit({ name: 'compile.session.eviction', value: 1, reason });
    const disposal = record.session.dispose();
    this.pendingDisposals.add(disposal);
    disposal.finally(() => this.pendingDisposals.delete(disposal)).catch(() => undefined);
  }

  private touchRepo(repo: RepoCompilerSessionContainer, now: number): void {
    repo.lastAccessAt = now;
    repo.lastAccessSequence = this.nextAccessSequence();
  }

  private touchEntry(repo: RepoCompilerSessionContainer, record: EntrySessionRecord, now: number): void {
    record.lastAccessAt = now;
    record.lastAccessSequence = this.nextAccessSequence();
    this.touchRepo(repo, now);
  }

  private nextAccessSequence(): number {
    this.accessSequence += 1;
    return this.accessSequence;
  }

  private activeEntryCount(): number {
    return [...this.repos.values()].reduce((count, repo) => count + repo.entrySessions.size, 0);
  }

  private estimatedFileBytes(): number {
    let bytes = 0;
    for (const repo of this.repos.values()) {
      bytes += repo.getFileBytes();
      for (const record of repo.entrySessions.values()) {
        bytes += record.session.getDebugState().estimatedFileBytes;
      }
    }
    return bytes;
  }

  private emitCoreMetric(metric: RunJSCompilerSessionMetric): void {
    this.emit({
      name: metric.name,
      value: metric.count,
      durationMs: metric.durationMs,
      reused: metric.reused,
    });
  }

  private emitGauges(): void {
    this.emit({ name: 'compile.session.active_repos', value: this.repos.size });
    this.emit({ name: 'compile.session.active_entries', value: this.activeEntryCount() });
    this.emit({ name: 'compile.session.estimated_file_bytes', value: this.estimatedFileBytes() });
  }

  private emit(metric: LightExtensionCompilerSessionMetric): void {
    this.metricObserver?.(metric);
  }

  private async waitForPendingDisposals(): Promise<void> {
    if (this.pendingDisposals.size === 0) {
      return;
    }
    await Promise.allSettled([...this.pendingDisposals]);
  }

  private assertActive(): void {
    if (this.disposed) {
      throw new Error('Light extension compiler session manager has been disposed.');
    }
  }
}

export function buildLightExtensionCompilerSessionContract(input: {
  repoId: string;
  entryIdentity: string;
  inputManifest: CompileInputManifest;
  typeLibraryIds?: readonly string[];
  authoringInspectorFingerprint?: string;
}): RunJSCompilerSessionContract {
  const components = LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.components;
  return {
    repoId: input.repoId,
    entryIdentity: input.entryIdentity,
    entryPath: input.inputManifest.entryPath,
    runtimeVersion: input.inputManifest.runtimeVersion,
    surfaceStyle: input.inputManifest.compilerSurfaceStyle as RunJSCompilerSessionContract['surfaceStyle'],
    modelUse: input.inputManifest.modelUse,
    runtimeContract: input.inputManifest.runtimeContract,
    compilerBuildId: input.inputManifest.compilerBuildId,
    securityPolicyFingerprint: sha256Hex(
      stableSerialize({
        compilerBridgeContract: components.compilerBridgeContract,
        importRewritePolicy: components.importRewritePolicy,
        importSecurityPolicy: components.importSecurityPolicy,
        runtimeSurfaceContract: components.runtimeSurfaceContract,
      }),
    ),
    typeLibraryFingerprint: LIGHT_EXTENSION_COMPILER_BUILD_IDENTITY.runjs.components.typeLibraryFingerprint,
    typeLibraryIds: input.typeLibraryIds,
    authoringInspectorFingerprint: input.authoringInspectorFingerprint,
  };
}

function assertCompileInputMatchesContract(
  input: CompileRunJSSourceWorkspaceInput,
  contract: RunJSCompilerSessionContract,
): void {
  const entryPath = normalizePath(input.entry);
  const runtimeVersion = input.runtimeVersion || 'v2';
  const modelUse = input.legacy?.metadata?.modelUse;
  const typeLibraryIds = [...new Set(input.typeLibraryIds || [])].sort();
  const expectedTypeLibraryIds = [...new Set(contract.typeLibraryIds || [])].sort();
  if (
    entryPath !== contract.entryPath ||
    runtimeVersion !== contract.runtimeVersion ||
    input.surfaceStyle !== contract.surfaceStyle ||
    (typeof modelUse === 'string' ? modelUse : undefined) !== contract.modelUse ||
    stableSerialize(typeLibraryIds) !== stableSerialize(expectedTypeLibraryIds)
  ) {
    throw new TypeError('RunJS compile input does not match the compiler session contract');
  }
}

function normalizeLimit(value: number | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }
  if (!Number.isFinite(value) || value < 0) {
    throw new TypeError('Compiler session limits must be finite non-negative numbers');
  }
  return Math.floor(value);
}

function compareRepoLru(left: RepoCompilerSessionContainer, right: RepoCompilerSessionContainer): number {
  return left.lastAccessSequence - right.lastAccessSequence || left.repoId.localeCompare(right.repoId);
}

function compareEntryLru(left: EntrySessionRecord, right: EntrySessionRecord): number {
  return left.lastAccessSequence - right.lastAccessSequence || left.identity.key.localeCompare(right.identity.key);
}
