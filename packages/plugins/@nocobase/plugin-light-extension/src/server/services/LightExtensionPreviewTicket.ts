/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Cache } from '@nocobase/cache';
import type { Transaction } from '@nocobase/database';
import { sha256Hex, stableSerialize } from '@nocobase/runjs';
import { randomBytes } from 'node:crypto';

import { LightExtensionError } from '../../shared/errors';
import type {
  LightExtensionDiagnosticSeverity,
  LightExtensionKind,
  TrustedPreviewTicketSummary,
} from '../../shared/types';
import type { CompileInputManifest } from './LightExtensionCompileKey';
import {
  LightExtensionTrustedCompileCacheService,
  type TrustedCompileArtifact,
  type TrustedCompileCacheExpectation,
} from './LightExtensionTrustedCompileCacheService';

export const LIGHT_EXTENSION_PREVIEW_TICKET_SCHEMA_VERSION = 1 as const;
export const LIGHT_EXTENSION_PREVIEW_TICKET_CACHE_NAME = 'light-extension-preview-tickets';
export const LIGHT_EXTENSION_PREVIEW_TICKET_CACHE_PREFIX = 'light-extension:preview-ticket';
export const LIGHT_EXTENSION_PREVIEW_TICKET_DEFAULT_TTL_MS = 5 * 60 * 1000;
export const LIGHT_EXTENSION_PREVIEW_TICKET_MAX_TTL_MS = 10 * 60 * 1000;

export type LightExtensionPreviewTicketEvent = 'issued' | 'hit' | 'miss' | 'expired' | 'mismatch' | 'reused';

export interface LightExtensionPreviewTicketEventSummary {
  event: LightExtensionPreviewTicketEvent;
  tokenFingerprint?: string;
  reason?: LightExtensionPreviewTicketMissReason;
}

export type LightExtensionPreviewTicketObserver = (
  summary: LightExtensionPreviewTicketEventSummary,
) => void | Promise<void>;

export interface TrustedPreviewDiagnosticSummary {
  code: string;
  severity: LightExtensionDiagnosticSeverity;
  path?: string;
  kind?: string;
  entryName?: string;
}

export interface TrustedPreviewEntryIdentity {
  target: 'client';
  kind: LightExtensionKind;
  entryName: string;
}

export interface TrustedPreviewCompilePlanSummary {
  changedFileCount: number;
  affectedEntryCount: number;
  compileCandidates: TrustedPreviewEntryIdentity[];
  metadataOnlyEntries: TrustedPreviewEntryIdentity[];
  removedEntries: TrustedPreviewEntryIdentity[];
}

export interface TrustedPreviewTicketEntry extends TrustedPreviewEntryIdentity {
  entryId: string | null;
  entryPath: string;
  compileKey: string;
  filesHash: string;
  artifactHash: string;
  artifactFilesHash: string;
  runtimeVersion: string;
}

export interface TrustedPreviewTicketRecord {
  schemaVersion: typeof LIGHT_EXTENSION_PREVIEW_TICKET_SCHEMA_VERSION;
  repoId: string;
  baseHeadCommitId: string | null;
  actorId: string;
  workspaceDigest: string;
  candidateTreeHash: string;
  compilerBuildId: string;
  runtimeContract: string;
  compilePlan: TrustedPreviewCompilePlanSummary;
  entries: TrustedPreviewTicketEntry[];
  diagnostics: TrustedPreviewDiagnosticSummary[];
  issuedAt: string;
  expiresAt: string;
}

export type TrustedPreviewTicketIssueInput = Omit<
  TrustedPreviewTicketRecord,
  'schemaVersion' | 'issuedAt' | 'expiresAt'
>;

export type LightExtensionPreviewTicketReadResult =
  | { status: 'found'; record: TrustedPreviewTicketRecord }
  | { status: 'missing' }
  | { status: 'expired' };

interface PreviewTicketCache {
  set(key: string, value: unknown, ttl?: number): Promise<void>;
  get<T>(key: string): Promise<T | undefined>;
  del(key: string): Promise<void>;
}

export interface LightExtensionPreviewTicketStoreOptions {
  ttlMs?: number;
  now?: () => number;
  tokenFactory?: () => string;
  observer?: LightExtensionPreviewTicketObserver;
}

export class LightExtensionPreviewTicketStore {
  private readonly ttlMs: number;

  private readonly now: () => number;

  private readonly tokenFactory: () => string;

  private readonly observer?: LightExtensionPreviewTicketObserver;

  constructor(cache: Pick<Cache, 'set' | 'get' | 'del'>, options: LightExtensionPreviewTicketStoreOptions = {}) {
    this.cache = cache;
    this.ttlMs = normalizeTtl(options.ttlMs);
    this.now = options.now || Date.now;
    this.tokenFactory = options.tokenFactory || createOpaqueToken;
    this.observer = options.observer;
  }

  private readonly cache: PreviewTicketCache;

  async issue(input: TrustedPreviewTicketIssueInput): Promise<TrustedPreviewTicketSummary> {
    assertIssueInput(input);
    const ticket = this.tokenFactory();
    assertOpaqueToken(ticket);
    const issuedAtMs = this.now();
    const expiresAtMs = issuedAtMs + this.ttlMs;
    const record: TrustedPreviewTicketRecord = {
      ...cloneJson(input),
      schemaVersion: LIGHT_EXTENSION_PREVIEW_TICKET_SCHEMA_VERSION,
      issuedAt: new Date(issuedAtMs).toISOString(),
      expiresAt: new Date(expiresAtMs).toISOString(),
    };
    assertNoForbiddenPayload(record);
    await this.cache.set(toCacheKey(ticket), record, this.ttlMs);
    await notifyBestEffort(this.observer, {
      event: 'issued',
      tokenFingerprint: getPreviewTicketFingerprint(ticket),
    });
    return { ticket, expiresAt: record.expiresAt };
  }

  async read(ticket: string): Promise<LightExtensionPreviewTicketReadResult> {
    if (!isOpaqueToken(ticket)) {
      return { status: 'missing' };
    }
    const raw = await this.cache.get<unknown>(toCacheKey(ticket));
    const record = normalizeTicketRecord(raw);
    if (!record) {
      return { status: 'missing' };
    }
    if (Date.parse(record.expiresAt) <= this.now()) {
      return { status: 'expired' };
    }
    return { status: 'found', record };
  }

  async consume(ticket: string): Promise<void> {
    if (!isOpaqueToken(ticket)) {
      return;
    }
    await this.cache.del(toCacheKey(ticket));
  }
}

export type LightExtensionPreviewTicketMissReason =
  | 'not_provided'
  | 'unknown'
  | 'expired'
  | 'actor_mismatch'
  | 'repo_mismatch'
  | 'head_mismatch'
  | 'workspace_mismatch'
  | 'compiler_mismatch'
  | 'runtime_mismatch'
  | 'entry_mismatch'
  | 'artifact_missing'
  | 'artifact_corrupt';

export interface TrustedPreviewExpectedEntry extends TrustedPreviewEntryIdentity {
  entryId: string | null;
  entryPath: string;
  compileKey: string;
  filesHash: string;
  inputManifest: CompileInputManifest;
}

export interface LightExtensionPreviewTicketVerifyInput {
  previewTicket?: string;
  requirePreviewTicket?: boolean;
  repoId: string;
  actorId: string | null | undefined;
  baseHeadCommitId: string | null;
  workspaceDigest: string;
  compilerBuildId: string;
  runtimeContract: string;
  entries: readonly TrustedPreviewExpectedEntry[];
}

export type LightExtensionPreviewTicketVerification =
  | {
      status: 'hit';
      ticket: string;
      record: TrustedPreviewTicketRecord;
      artifacts: Map<string, TrustedCompileArtifact>;
    }
  | {
      status: 'miss';
      reason: LightExtensionPreviewTicketMissReason;
    };

export interface LightExtensionPreviewTicketVerifierOptions {
  observer?: LightExtensionPreviewTicketObserver;
}

/** Validates ticket evidence only. It never mutates Source, Entry, Reference, or runtime pointers. */
export class LightExtensionPreviewTicketVerifier {
  private readonly observer?: LightExtensionPreviewTicketObserver;

  constructor(
    private readonly store: LightExtensionPreviewTicketStore,
    private readonly compileCache: LightExtensionTrustedCompileCacheService,
    options: LightExtensionPreviewTicketVerifierOptions = {},
  ) {
    this.observer = options.observer;
  }

  async verify(
    input: LightExtensionPreviewTicketVerifyInput,
    transaction?: Transaction,
  ): Promise<LightExtensionPreviewTicketVerification> {
    const ticket = input.previewTicket;
    if (!ticket) {
      return this.miss(input.requirePreviewTicket, 'not_provided');
    }
    const read = await this.store.read(ticket);
    if (read.status !== 'found') {
      return this.miss(input.requirePreviewTicket, read.status === 'expired' ? 'expired' : 'unknown', ticket);
    }
    const mismatch = findTicketMismatch(read.record, input);
    if (mismatch) {
      return this.miss(input.requirePreviewTicket, mismatch, ticket);
    }

    const expectations = input.entries.map(
      (entry): TrustedCompileCacheExpectation => ({
        compileKey: entry.compileKey,
        filesHash: entry.filesHash,
        inputManifest: entry.inputManifest,
        artifactHash: read.record.entries.find((ticketEntry) => ticketEntry.compileKey === entry.compileKey)
          ?.artifactHash,
      }),
    );
    const lookup = await this.compileCache.loadVerified(expectations, transaction);
    if (lookup.missingKeys.size > 0) {
      return this.miss(input.requirePreviewTicket, 'artifact_missing', ticket);
    }
    if (lookup.corruptKeys.size > 0 || lookup.hits.size !== expectations.length) {
      return this.miss(input.requirePreviewTicket, 'artifact_corrupt', ticket);
    }
    for (const ticketEntry of read.record.entries) {
      const artifact = lookup.hits.get(ticketEntry.compileKey);
      if (
        !artifact ||
        artifact.artifactHash !== ticketEntry.artifactHash ||
        artifact.artifactFilesHash !== ticketEntry.artifactFilesHash ||
        artifact.version !== ticketEntry.runtimeVersion
      ) {
        return this.miss(input.requirePreviewTicket, 'artifact_corrupt', ticket);
      }
    }

    await notifyBestEffort(this.observer, {
      event: 'hit',
      tokenFingerprint: getPreviewTicketFingerprint(ticket),
    });
    return {
      status: 'hit',
      ticket,
      record: read.record,
      artifacts: lookup.hits,
    };
  }

  /** Must be called only after the Save transaction commits successfully. */
  async consumeAfterSuccessfulSave(ticket: string): Promise<void> {
    await this.store.consume(ticket);
    await notifyBestEffort(this.observer, {
      event: 'reused',
      tokenFingerprint: getPreviewTicketFingerprint(ticket),
    });
  }

  private async miss(
    required: boolean | undefined,
    reason: LightExtensionPreviewTicketMissReason,
    ticket?: string,
  ): Promise<LightExtensionPreviewTicketVerification> {
    await notifyBestEffort(this.observer, {
      event: reason === 'expired' ? 'expired' : isMismatchReason(reason) ? 'mismatch' : 'miss',
      ...(ticket ? { tokenFingerprint: getPreviewTicketFingerprint(ticket) } : {}),
      reason,
    });
    if (required) {
      throw new LightExtensionError(
        'LIGHT_EXTENSION_PREVIEW_TICKET_INVALID',
        'A valid trusted preview ticket is required to save this light extension source',
        {
          status: 409,
          details: {
            reason: publicMissReason(reason),
          },
        },
      );
    }
    return { status: 'miss', reason };
  }
}

export function getPreviewTicketFingerprint(ticket: string): string {
  return sha256Hex(ticket).slice(0, 12);
}

function findTicketMismatch(
  record: TrustedPreviewTicketRecord,
  input: LightExtensionPreviewTicketVerifyInput,
): LightExtensionPreviewTicketMissReason | undefined {
  if (!input.actorId || record.actorId !== input.actorId) {
    return 'actor_mismatch';
  }
  if (record.repoId !== input.repoId) {
    return 'repo_mismatch';
  }
  if (record.baseHeadCommitId !== input.baseHeadCommitId) {
    return 'head_mismatch';
  }
  if (record.workspaceDigest !== input.workspaceDigest || record.candidateTreeHash !== input.workspaceDigest) {
    return 'workspace_mismatch';
  }
  if (record.compilerBuildId !== input.compilerBuildId) {
    return 'compiler_mismatch';
  }
  if (record.runtimeContract !== input.runtimeContract) {
    return 'runtime_mismatch';
  }
  if (
    stableSerialize(normalizeTicketEntries(record.entries)) !== stableSerialize(normalizeExpectedEntries(input.entries))
  ) {
    return 'entry_mismatch';
  }
  return undefined;
}

function normalizeTicketEntries(entries: readonly TrustedPreviewTicketEntry[]) {
  return entries
    .map((entry) => ({
      target: entry.target,
      kind: entry.kind,
      entryName: entry.entryName,
      entryId: entry.entryId,
      entryPath: entry.entryPath,
      compileKey: entry.compileKey,
      filesHash: entry.filesHash,
      runtimeVersion: entry.runtimeVersion,
    }))
    .sort(compareTicketEntries);
}

function normalizeExpectedEntries(entries: readonly TrustedPreviewExpectedEntry[]) {
  return entries
    .map((entry) => ({
      target: entry.target,
      kind: entry.kind,
      entryName: entry.entryName,
      entryId: entry.entryId,
      entryPath: entry.entryPath,
      compileKey: entry.compileKey,
      filesHash: entry.filesHash,
      runtimeVersion: entry.inputManifest.runtimeVersion,
    }))
    .sort(compareTicketEntries);
}

function compareTicketEntries(
  left: { target: string; kind: string; entryName: string },
  right: { target: string; kind: string; entryName: string },
): number {
  return `${left.target}\0${left.kind}\0${left.entryName}`.localeCompare(
    `${right.target}\0${right.kind}\0${right.entryName}`,
  );
}

function normalizeTtl(ttlMs: number | undefined): number {
  const value = ttlMs ?? LIGHT_EXTENSION_PREVIEW_TICKET_DEFAULT_TTL_MS;
  if (!Number.isSafeInteger(value) || value <= 0 || value > LIGHT_EXTENSION_PREVIEW_TICKET_MAX_TTL_MS) {
    throw new TypeError(`Preview ticket TTL must be between 1 and ${LIGHT_EXTENSION_PREVIEW_TICKET_MAX_TTL_MS}ms`);
  }
  return value;
}

function createOpaqueToken(): string {
  return `lept_${randomBytes(32).toString('base64url')}`;
}

function assertOpaqueToken(ticket: string): void {
  if (!isOpaqueToken(ticket)) {
    throw new TypeError('Preview ticket token factory must return an opaque high-entropy token');
  }
}

function isOpaqueToken(ticket: unknown): ticket is string {
  return typeof ticket === 'string' && /^lept_[A-Za-z0-9_-]{43,}$/u.test(ticket);
}

function toCacheKey(ticket: string): string {
  return `ticket:${sha256Hex(ticket)}`;
}

function assertIssueInput(input: TrustedPreviewTicketIssueInput): void {
  if (
    !input.repoId ||
    !input.actorId ||
    !input.workspaceDigest ||
    input.workspaceDigest !== input.candidateTreeHash ||
    !input.compilerBuildId ||
    !input.runtimeContract ||
    input.entries.length === 0
  ) {
    throw new TypeError('Trusted preview ticket record is incomplete');
  }
}

function normalizeTicketRecord(value: unknown): TrustedPreviewTicketRecord | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const record = value as Partial<TrustedPreviewTicketRecord>;
  if (
    record.schemaVersion !== LIGHT_EXTENSION_PREVIEW_TICKET_SCHEMA_VERSION ||
    typeof record.repoId !== 'string' ||
    (record.baseHeadCommitId !== null && typeof record.baseHeadCommitId !== 'string') ||
    typeof record.actorId !== 'string' ||
    typeof record.workspaceDigest !== 'string' ||
    record.candidateTreeHash !== record.workspaceDigest ||
    typeof record.compilerBuildId !== 'string' ||
    typeof record.runtimeContract !== 'string' ||
    !record.compilePlan ||
    !Array.isArray(record.entries) ||
    record.entries.length === 0 ||
    !Array.isArray(record.diagnostics) ||
    typeof record.issuedAt !== 'string' ||
    !Number.isFinite(Date.parse(record.issuedAt)) ||
    typeof record.expiresAt !== 'string' ||
    !Number.isFinite(Date.parse(record.expiresAt))
  ) {
    return undefined;
  }
  try {
    assertNoForbiddenPayload(record);
  } catch {
    return undefined;
  }
  return cloneJson(record as TrustedPreviewTicketRecord);
}

function assertNoForbiddenPayload(value: unknown): void {
  if (!value || typeof value !== 'object') {
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      assertNoForbiddenPayload(item);
    }
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (key === 'content' || key === 'sourceMap') {
      throw new TypeError(`Preview ticket records must not contain ${key}`);
    }
    assertNoForbiddenPayload(child);
  }
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isMismatchReason(reason: LightExtensionPreviewTicketMissReason): boolean {
  return reason.endsWith('_mismatch');
}

function publicMissReason(reason: LightExtensionPreviewTicketMissReason): 'missing' | 'expired' | 'mismatch' {
  if (reason === 'expired') {
    return 'expired';
  }
  if (reason === 'not_provided' || reason === 'unknown' || reason === 'artifact_missing') {
    return 'missing';
  }
  return 'mismatch';
}

async function notifyBestEffort(
  observer: LightExtensionPreviewTicketObserver | undefined,
  summary: LightExtensionPreviewTicketEventSummary,
): Promise<void> {
  if (!observer) {
    return;
  }
  try {
    await observer(summary);
  } catch {
    // Ticket telemetry must never change preview or Save correctness.
  }
}
