/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash, randomUUID } from 'node:crypto';

import { LightExtensionError } from '../../shared/errors';
import { createLightExtensionProblem, stableSerializeLightExtensionProblemValue } from '../../shared/problems';
import type {
  LightExtensionPreviewProblemAppendInput,
  LightExtensionPreviewProblemCloseInput,
  LightExtensionPreviewProblemItem,
  LightExtensionPreviewProblemListInput,
  LightExtensionPreviewProblemOpenInput,
  LightExtensionPreviewProblemSessionIdentity,
  LightExtensionPreviewProblemSessionResult,
  LightExtensionPreviewProblemSessionState,
  LightExtensionProblem,
} from '../../shared/types';

const DEFAULT_TTL_MS = 2 * 60 * 1000;
const MIN_TTL_MS = 10 * 1000;
const MAX_TTL_MS = 5 * 60 * 1000;
const EXPIRED_RETENTION_MS = 60 * 1000;
const LOCK_TTL_MS = 5 * 1000;
const MAX_PROBLEM_COUNT = 100;
const MAX_PROBLEM_BYTES = 32 * 1024;
const MAX_AGGREGATE_BYTES = 256 * 1024;

interface StoredPreviewProblemSession {
  schemaVersion: 1;
  sessionId: string;
  appName: string;
  actorUserId: string;
  roleNames: string[];
  identity: LightExtensionPreviewProblemSessionIdentity;
  state: LightExtensionPreviewProblemSessionState;
  cursor: number;
  expiresAt: number;
  droppedCount: number;
  aggregateBytes: number;
  overflowRecorded: boolean;
  items: LightExtensionPreviewProblemItem[];
}

export interface LightExtensionPreviewProblemStorage {
  get(sessionId: string): Promise<StoredPreviewProblemSession | undefined>;
  set(sessionId: string, value: StoredPreviewProblemSession, ttlMs: number): Promise<void>;
  delete(sessionId: string): Promise<void>;
  runExclusive<T>(sessionId: string, callback: () => Promise<T>): Promise<T>;
}

export interface LightExtensionPreviewProblemServiceContext {
  actorUserId: string | null;
  roleNames: string[];
}

interface PreviewProblemCache {
  get<T>(key: string): Promise<T | undefined>;
  set(key: string, value: unknown, ttlMs?: number): Promise<void>;
  del(key: string): Promise<void>;
}

interface PreviewProblemLockManager {
  runExclusive<T>(key: string, callback: () => Promise<T>, ttlMs?: number): Promise<T>;
}

export class CacheLightExtensionPreviewProblemStorage implements LightExtensionPreviewProblemStorage {
  constructor(
    private readonly cache: PreviewProblemCache,
    private readonly lockManager: PreviewProblemLockManager,
  ) {}

  async get(sessionId: string): Promise<StoredPreviewProblemSession | undefined> {
    return this.cache.get<StoredPreviewProblemSession>(getSessionCacheKey(sessionId));
  }

  async set(sessionId: string, value: StoredPreviewProblemSession, ttlMs: number): Promise<void> {
    await this.cache.set(getSessionCacheKey(sessionId), value, ttlMs);
  }

  async delete(sessionId: string): Promise<void> {
    await this.cache.del(getSessionCacheKey(sessionId));
  }

  async runExclusive<T>(sessionId: string, callback: () => Promise<T>): Promise<T> {
    return this.lockManager.runExclusive(
      `light-extension-preview-problems:${getSessionCacheKey(sessionId)}`,
      callback,
      LOCK_TTL_MS,
    );
  }
}

export class MemoryLightExtensionPreviewProblemStorage implements LightExtensionPreviewProblemStorage {
  private readonly records = new Map<string, { value: StoredPreviewProblemSession; retainedUntil: number }>();

  private readonly locks = new Map<string, Promise<void>>();

  constructor(private readonly now: () => number = Date.now) {}

  async get(sessionId: string): Promise<StoredPreviewProblemSession | undefined> {
    const record = this.records.get(sessionId);
    if (!record) {
      return undefined;
    }
    if (record.retainedUntil <= this.now()) {
      this.records.delete(sessionId);
      return undefined;
    }
    return structuredClone(record.value);
  }

  async set(sessionId: string, value: StoredPreviewProblemSession, ttlMs: number): Promise<void> {
    this.records.set(sessionId, { value: structuredClone(value), retainedUntil: this.now() + ttlMs });
  }

  async delete(sessionId: string): Promise<void> {
    this.records.delete(sessionId);
  }

  async runExclusive<T>(sessionId: string, callback: () => Promise<T>): Promise<T> {
    const previous = this.locks.get(sessionId) || Promise.resolve();
    let release: (() => void) | undefined;
    const current = new Promise<void>((resolve) => {
      release = resolve;
    });
    const queued = previous.then(() => current);
    this.locks.set(sessionId, queued);
    await previous;
    try {
      return await callback();
    } finally {
      release?.();
      if (this.locks.get(sessionId) === queued) {
        this.locks.delete(sessionId);
      }
    }
  }
}

export class LightExtensionPreviewProblemService {
  constructor(
    private readonly appName: string,
    private readonly storage: LightExtensionPreviewProblemStorage,
    private readonly now: () => number = Date.now,
    private readonly createId: () => string = randomUUID,
  ) {}

  async open(
    input: LightExtensionPreviewProblemOpenInput,
    ctx: LightExtensionPreviewProblemServiceContext,
  ): Promise<LightExtensionPreviewProblemSessionResult> {
    const access = this.requireAccess(ctx);
    const identity = normalizeOpenIdentity(input, `execution:${this.createId()}`);
    const sessionId = `preview:${this.createId()}`;
    const ttlMs = normalizeTtl(input.ttlMs);
    const record: StoredPreviewProblemSession = {
      schemaVersion: 1,
      sessionId,
      appName: this.appName,
      actorUserId: access.actorUserId,
      roleNames: access.roleNames,
      identity,
      state: 'active',
      cursor: 0,
      expiresAt: this.now() + ttlMs,
      droppedCount: 0,
      aggregateBytes: 0,
      overflowRecorded: false,
      items: [],
    };
    await this.storage.set(sessionId, record, ttlMs + EXPIRED_RETENTION_MS);
    return toResult(record, 0, this.now());
  }

  async append(
    input: LightExtensionPreviewProblemAppendInput,
    ctx: LightExtensionPreviewProblemServiceContext,
  ): Promise<LightExtensionPreviewProblemSessionResult> {
    return this.storage.runExclusive(input.sessionId, async () => {
      const record = await this.requireSession(input, ctx);
      const startCursor = record.cursor;
      const initialDroppedCount = record.droppedCount;
      if (getLogicalState(record, this.now()) !== 'active') {
        throw new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', 'Preview problem session is closed', {
          status: 409,
          details: { state: getLogicalState(record, this.now()) },
        });
      }

      const candidates = input.problems.slice(0, MAX_PROBLEM_COUNT);
      record.droppedCount += input.problems.length - candidates.length;
      for (const candidate of candidates) {
        const problem = normalizeProblem(candidate, record);
        if (!problem) {
          record.droppedCount += 1;
          continue;
        }
        const bytes = Buffer.byteLength(JSON.stringify(problem), 'utf8');
        if (
          bytes > MAX_PROBLEM_BYTES ||
          record.items.length >= MAX_PROBLEM_COUNT - 1 ||
          record.aggregateBytes + bytes > MAX_AGGREGATE_BYTES
        ) {
          record.droppedCount += 1;
          continue;
        }
        record.cursor += 1;
        record.aggregateBytes += bytes;
        record.items.push({ cursor: record.cursor, problem });
      }
      if (record.droppedCount > initialDroppedCount) {
        appendOverflowProblem(record);
      }

      await this.persist(record);
      return toResult(record, startCursor, this.now());
    });
  }

  async list(
    input: LightExtensionPreviewProblemListInput,
    ctx: LightExtensionPreviewProblemServiceContext,
  ): Promise<LightExtensionPreviewProblemSessionResult> {
    const record = await this.requireSession(input, ctx);
    return toResult(record, normalizeCursor(input.cursor), this.now());
  }

  async watch(
    input: LightExtensionPreviewProblemListInput,
    ctx: LightExtensionPreviewProblemServiceContext,
  ): Promise<LightExtensionPreviewProblemSessionResult> {
    return this.list(input, ctx);
  }

  async close(
    input: LightExtensionPreviewProblemCloseInput,
    ctx: LightExtensionPreviewProblemServiceContext,
  ): Promise<LightExtensionPreviewProblemSessionResult> {
    return this.storage.runExclusive(input.sessionId, async () => {
      const record = await this.requireSession(input, ctx);
      const logicalState = getLogicalState(record, this.now());
      if (logicalState === 'expired') {
        return toResult(record, record.cursor, this.now());
      }
      if (record.state === 'active') {
        record.state = input.state;
        await this.persist(record);
      }
      return toResult(record, record.cursor, this.now());
    });
  }

  private requireAccess(ctx: LightExtensionPreviewProblemServiceContext): {
    actorUserId: string;
    roleNames: string[];
  } {
    const actorUserId = normalizeString(ctx.actorUserId, 256);
    const roleNames = normalizeRoleNames(ctx.roleNames);
    if (!actorUserId || !roleNames.length) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_PERMISSION_DENIED',
        'Preview problem session requires a user and role',
      );
    }
    return { actorUserId, roleNames };
  }

  private async requireSession(
    input: LightExtensionPreviewProblemListInput,
    ctx: LightExtensionPreviewProblemServiceContext,
  ): Promise<StoredPreviewProblemSession> {
    const access = this.requireAccess(ctx);
    const sessionId = normalizeString(input.sessionId, 256);
    const record = sessionId ? await this.storage.get(sessionId) : undefined;
    if (
      !record ||
      record.appName !== this.appName ||
      record.actorUserId !== access.actorUserId ||
      !sameStrings(record.roleNames, access.roleNames) ||
      !sameIdentity(record.identity, input)
    ) {
      throw new LightExtensionError('LIGHT_EXTENSION_ENTRY_NOT_FOUND', 'Preview problem session was not found');
    }
    return record;
  }

  private async persist(record: StoredPreviewProblemSession): Promise<void> {
    const remaining = Math.max(1, record.expiresAt - this.now() + EXPIRED_RETENTION_MS);
    await this.storage.set(record.sessionId, record, remaining);
  }
}

function normalizeOpenIdentity(
  input: LightExtensionPreviewProblemOpenInput,
  executionId: string,
): LightExtensionPreviewProblemSessionIdentity {
  const repoId = requireString(input.repoId, 'repoId');
  const entryId = requireString(input.entryId, 'entryId');
  const snapshotId = requireString(input.snapshotId, 'snapshotId', 128 * 1024);
  const artifactHash = requireString(input.artifactHash, 'artifactHash', 128);
  if (!/^[a-f0-9]{64}$/u.test(artifactHash)) {
    throw invalidInput('artifactHash must be a SHA-256 hex digest');
  }
  if (!input.ownerLocator || typeof input.ownerLocator !== 'object' || Array.isArray(input.ownerLocator)) {
    throw invalidInput('ownerLocator is required');
  }
  return {
    repoId,
    entryId,
    ownerLocator: structuredClone(input.ownerLocator),
    snapshotId,
    artifactHash,
    executionId,
  };
}

function normalizeProblem(
  candidate: LightExtensionProblem,
  session: StoredPreviewProblemSession,
): LightExtensionProblem | undefined {
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return undefined;
  }
  const phase = candidate.phase;
  const source = candidate.source;
  const severity = candidate.severity;
  if (!['runtime', 'react', 'api', 'permission', 'infrastructure'].includes(phase)) {
    return undefined;
  }
  if (!['host-runtime', 'react', 'api', 'server'].includes(source) || !['error', 'warning'].includes(severity)) {
    return undefined;
  }
  const code = normalizeString(candidate.code, 160);
  const message = normalizeString(candidate.message, 2_000);
  if (!code || !message) {
    return undefined;
  }
  const identity = session.identity;
  const range = normalizeProblemRange(candidate.range);
  const details =
    candidate.details && typeof candidate.details === 'object' && !Array.isArray(candidate.details)
      ? {
          ...candidate.details,
          previewSessionId: session.sessionId,
          executionId: identity.executionId,
          artifactHash: identity.artifactHash,
          snapshotId: identity.snapshotId,
        }
      : {
          previewSessionId: session.sessionId,
          executionId: identity.executionId,
          artifactHash: identity.artifactHash,
          snapshotId: identity.snapshotId,
        };
  return createLightExtensionProblem({
    phase,
    source,
    severity,
    code,
    message,
    snapshotId: identity.snapshotId,
    requestId: identity.executionId,
    ...(normalizeString(candidate.path, 1_024) ? { path: normalizeString(candidate.path, 1_024) } : {}),
    ...(range ? { range } : {}),
    ...(normalizeString(candidate.kind, 256) ? { kind: normalizeString(candidate.kind, 256) } : {}),
    ...(normalizeString(candidate.entryName, 256) ? { entryName: normalizeString(candidate.entryName, 256) } : {}),
    ...(normalizeString(candidate.stack, 16 * 1024) ? { stack: normalizeString(candidate.stack, 16 * 1024) } : {}),
    ...(normalizeString(candidate.fixHint, 1_024) ? { fixHint: normalizeString(candidate.fixHint, 1_024) } : {}),
    details,
  });
}

function normalizeProblemRange(range: LightExtensionProblem['range']): LightExtensionProblem['range'] | undefined {
  if (!range || !isFinitePosition(range.start)) {
    return undefined;
  }
  return {
    start: {
      line: Math.max(1, Math.trunc(range.start.line)),
      column: Math.max(1, Math.trunc(range.start.column)),
    },
    ...(range.end && isFinitePosition(range.end)
      ? {
          end: {
            line: Math.max(1, Math.trunc(range.end.line)),
            column: Math.max(1, Math.trunc(range.end.column)),
          },
        }
      : {}),
  };
}

function isFinitePosition(value: unknown): value is { line: number; column: number } {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const position = value as { line?: unknown; column?: unknown };
  return (
    typeof position.line === 'number' &&
    Number.isFinite(position.line) &&
    typeof position.column === 'number' &&
    Number.isFinite(position.column)
  );
}

function appendOverflowProblem(record: StoredPreviewProblemSession): void {
  if (record.overflowRecorded || record.items.length >= MAX_PROBLEM_COUNT) {
    return;
  }
  const problem = createLightExtensionProblem({
    phase: 'infrastructure',
    source: 'server',
    severity: 'warning',
    code: 'LIGHT_EXTENSION_PREVIEW_PROBLEM_OVERFLOW',
    message: 'Additional preview problems were dropped because the session limit was reached.',
    snapshotId: record.identity.snapshotId,
    requestId: record.identity.executionId,
    details: { droppedCount: record.droppedCount },
  });
  const bytes = Buffer.byteLength(JSON.stringify(problem), 'utf8');
  if (record.aggregateBytes + bytes > MAX_AGGREGATE_BYTES) {
    return;
  }
  record.cursor += 1;
  record.aggregateBytes += bytes;
  record.items.push({ cursor: record.cursor, problem });
  record.overflowRecorded = true;
}

function toResult(
  record: StoredPreviewProblemSession,
  cursor: number,
  now = Date.now(),
): LightExtensionPreviewProblemSessionResult {
  const state = getLogicalState(record, now);
  const items = state === 'expired' ? [] : record.items.filter((item) => item.cursor > cursor);
  return {
    schemaVersion: 1,
    sessionId: record.sessionId,
    ...structuredClone(record.identity),
    state,
    cursor: record.cursor,
    nextCursor: record.cursor,
    expiresAt: new Date(record.expiresAt).toISOString(),
    droppedCount: record.droppedCount,
    items,
  };
}

function getLogicalState(record: StoredPreviewProblemSession, now: number): LightExtensionPreviewProblemSessionState {
  return now >= record.expiresAt ? 'expired' : record.state;
}

function sameIdentity(
  expected: LightExtensionPreviewProblemSessionIdentity,
  actual: LightExtensionPreviewProblemSessionIdentity,
): boolean {
  return (
    expected.repoId === actual.repoId &&
    expected.entryId === actual.entryId &&
    expected.snapshotId === actual.snapshotId &&
    expected.artifactHash === actual.artifactHash &&
    expected.executionId === actual.executionId &&
    stableSerializeLightExtensionProblemValue(expected.ownerLocator) ===
      stableSerializeLightExtensionProblemValue(actual.ownerLocator)
  );
}

function normalizeRoleNames(roleNames: string[]): string[] {
  return [
    ...new Set(roleNames.map((role) => normalizeString(role, 256)).filter((role): role is string => Boolean(role))),
  ].sort();
}

function sameStrings(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function normalizeCursor(cursor: number | undefined): number {
  return typeof cursor === 'number' && Number.isFinite(cursor) ? Math.max(0, Math.trunc(cursor)) : 0;
}

function normalizeTtl(ttlMs: number | undefined): number {
  if (typeof ttlMs !== 'number' || !Number.isFinite(ttlMs)) {
    return DEFAULT_TTL_MS;
  }
  return Math.min(MAX_TTL_MS, Math.max(MIN_TTL_MS, Math.trunc(ttlMs)));
}

function requireString(value: unknown, key: string, maxLength = 512): string {
  const normalized = normalizeString(value, maxLength);
  if (!normalized) {
    throw invalidInput(`${key} is required`);
  }
  return normalized;
}

function normalizeString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : undefined;
}

function invalidInput(message: string): LightExtensionError {
  return new LightExtensionError('LIGHT_EXTENSION_INVALID_INPUT', message);
}

function getSessionCacheKey(sessionId: string): string {
  return `session:${createHash('sha256').update(sessionId).digest('hex')}`;
}
