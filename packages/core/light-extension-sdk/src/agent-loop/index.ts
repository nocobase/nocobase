/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const LIGHT_EXTENSION_AGENT_LOOP_SCHEMA_VERSION = 1 as const;
export const LIGHT_EXTENSION_PREVIEW_SESSION_DESCRIPTOR_VERSION = 1 as const;
export const LIGHT_EXTENSION_PREVIEW_SESSION_TOKEN_PREFIX = 'light-preview-v1.';

export type LightExtensionAgentLoopStatus =
  | 'pulled'
  | 'dirty'
  | 'checking'
  | 'check_failed'
  | 'ready_for_preview'
  | 'preview_active'
  | 'runtime_failed'
  | 'ready_to_save'
  | 'saving'
  | 'conflict'
  | 'complete'
  | 'needs_attention';

export type LightExtensionPreviewProblemSessionState = 'active' | 'completed' | 'stale' | 'expired';

export interface LightExtensionAgentProblem {
  fingerprint: string;
  severity: 'error' | 'warning';
  code?: string;
  message?: string;
  snapshotId?: string;
  details?: Record<string, unknown>;
}

export interface LightExtensionAgentLoopBudget {
  maxCheckRounds: number;
  maxDurationMs: number;
  repeatedFingerprintThreshold: number;
}

export interface LightExtensionAgentPreviewState {
  sessionId: string;
  cursor: number;
  state: LightExtensionPreviewProblemSessionState;
}

export interface LightExtensionAgentLoopState {
  schemaVersion: typeof LIGHT_EXTENSION_AGENT_LOOP_SCHEMA_VERSION;
  status: LightExtensionAgentLoopStatus;
  snapshotId: string;
  contextHash: string;
  baseHeadCommitId: string | null;
  startedAt: string;
  updatedAt: string;
  checkRounds: number;
  repeatedFingerprintRounds: number;
  lastErrorFingerprintSet: string[];
  problems: LightExtensionAgentProblem[];
  budget: LightExtensionAgentLoopBudget;
  preview?: LightExtensionAgentPreviewState;
  needsAttentionReason?: 'max_check_rounds' | 'max_duration' | 'repeated_fingerprints';
  conflict?: {
    currentHeadCommitId?: string | null;
  };
  completedHeadCommitId?: string;
}

export type LightExtensionAgentLoopEvent =
  | { type: 'local_changed'; snapshotId: string; contextHash?: string }
  | { type: 'budget_checked' }
  | { type: 'check_started' }
  | {
      type: 'check_completed';
      accepted: boolean;
      snapshotId: string;
      contextHash: string;
      problems: LightExtensionAgentProblem[];
    }
  | { type: 'preview_opened'; sessionId: string; snapshotId: string; contextHash: string }
  | {
      type: 'preview_polled';
      sessionId: string;
      cursor: number;
      state: LightExtensionPreviewProblemSessionState;
      snapshotId: string;
      contextHash: string;
      problems: LightExtensionAgentProblem[];
    }
  | { type: 'save_started' }
  | { type: 'save_failed' }
  | { type: 'save_conflict'; currentHeadCommitId?: string | null }
  | { type: 'save_completed'; headCommitId: string };

export interface LightExtensionPreviewSessionDescriptor {
  schemaVersion: typeof LIGHT_EXTENSION_PREVIEW_SESSION_DESCRIPTOR_VERSION;
  sessionId: string;
  repoId: string;
  entryId: string;
  ownerLocator: object;
  snapshotId: string;
  contextHash: string;
  artifactHash: string;
  executionId: string;
}

const defaultBudget: LightExtensionAgentLoopBudget = {
  maxCheckRounds: 20,
  maxDurationMs: 15 * 60 * 1000,
  repeatedFingerprintThreshold: 3,
};

export function createLightExtensionAgentLoopState(input: {
  snapshotId: string;
  contextHash: string;
  baseHeadCommitId: string | null;
  budget?: Partial<LightExtensionAgentLoopBudget>;
  now?: string;
}): LightExtensionAgentLoopState {
  const now = normalizeTimestamp(input.now);
  return {
    schemaVersion: LIGHT_EXTENSION_AGENT_LOOP_SCHEMA_VERSION,
    status: 'pulled',
    snapshotId: requireNonEmptyString(input.snapshotId, 'snapshotId'),
    contextHash: requireNonEmptyString(input.contextHash, 'contextHash'),
    baseHeadCommitId: input.baseHeadCommitId,
    startedAt: now,
    updatedAt: now,
    checkRounds: 0,
    repeatedFingerprintRounds: 0,
    lastErrorFingerprintSet: [],
    problems: [],
    budget: normalizeBudget(input.budget),
  };
}

export function advanceLightExtensionAgentLoop(
  state: LightExtensionAgentLoopState,
  event: LightExtensionAgentLoopEvent,
  nowValue?: string,
): LightExtensionAgentLoopState {
  const now = normalizeTimestamp(nowValue);
  const budgetReason = getBudgetReason(state, now);
  if (
    budgetReason &&
    event.type !== 'save_completed' &&
    event.type !== 'save_conflict' &&
    event.type !== 'save_failed'
  ) {
    return toNeedsAttention(state, budgetReason, now);
  }

  switch (event.type) {
    case 'local_changed': {
      const snapshotId = requireNonEmptyString(event.snapshotId, 'snapshotId');
      if (snapshotId === state.snapshotId && (!event.contextHash || event.contextHash === state.contextHash)) {
        return { ...state, updatedAt: now };
      }
      return compactState({
        ...state,
        status: 'dirty',
        snapshotId,
        contextHash: event.contextHash || state.contextHash,
        updatedAt: now,
        problems: [],
        preview: undefined,
        needsAttentionReason: undefined,
        conflict: undefined,
        completedHeadCommitId: undefined,
      });
    }
    case 'budget_checked':
      return { ...state, updatedAt: now };
    case 'check_started': {
      if (state.checkRounds >= state.budget.maxCheckRounds) {
        return toNeedsAttention(state, 'max_check_rounds', now);
      }
      return compactState({
        ...state,
        status: 'checking',
        startedAt: state.checkRounds === 0 ? now : state.startedAt,
        updatedAt: now,
        checkRounds: state.checkRounds + 1,
        preview: undefined,
        conflict: undefined,
        completedHeadCommitId: undefined,
      });
    }
    case 'check_completed': {
      assertCurrentIdentity(state, event.snapshotId, event.contextHash);
      const problems = normalizeProblems(event.problems);
      const errors = problems.filter((problem) => problem.severity === 'error');
      if (event.accepted && errors.length === 0) {
        return compactState({
          ...state,
          status: 'ready_for_preview',
          updatedAt: now,
          repeatedFingerprintRounds: 0,
          lastErrorFingerprintSet: [],
          problems,
          preview: undefined,
          needsAttentionReason: undefined,
        });
      }
      const fingerprints = uniqueSorted(errors.map((problem) => problem.fingerprint));
      const repeatedFingerprintRounds = sameStrings(fingerprints, state.lastErrorFingerprintSet)
        ? state.repeatedFingerprintRounds + 1
        : 1;
      const next = compactState({
        ...state,
        status: 'check_failed',
        updatedAt: now,
        repeatedFingerprintRounds,
        lastErrorFingerprintSet: fingerprints,
        problems,
        preview: undefined,
      });
      return repeatedFingerprintRounds >= state.budget.repeatedFingerprintThreshold
        ? toNeedsAttention(next, 'repeated_fingerprints', now)
        : next;
    }
    case 'preview_opened': {
      assertCurrentIdentity(state, event.snapshotId, event.contextHash);
      if (state.status !== 'ready_for_preview' && state.status !== 'preview_active') {
        throw new Error(`Cannot open preview from agent loop state ${state.status}`);
      }
      return compactState({
        ...state,
        status: 'preview_active',
        updatedAt: now,
        problems: [],
        preview: {
          sessionId: requireNonEmptyString(event.sessionId, 'sessionId'),
          cursor: 0,
          state: 'active',
        },
      });
    }
    case 'preview_polled': {
      assertCurrentIdentity(state, event.snapshotId, event.contextHash);
      const sessionId = requireNonEmptyString(event.sessionId, 'sessionId');
      if (state.preview && state.preview.sessionId !== sessionId) {
        throw new Error('Preview session does not match the active agent loop session');
      }
      const problems = mergeProblems(state.problems, event.problems);
      const hasErrors = problems.some((problem) => problem.severity === 'error');
      const status: LightExtensionAgentLoopStatus = hasErrors
        ? 'runtime_failed'
        : event.state === 'completed'
          ? 'ready_to_save'
          : event.state === 'active'
            ? 'preview_active'
            : 'ready_for_preview';
      return compactState({
        ...state,
        status,
        updatedAt: now,
        problems,
        preview: {
          sessionId,
          cursor: normalizeCursor(event.cursor),
          state: event.state,
        },
      });
    }
    case 'save_started': {
      if (state.status !== 'ready_to_save') {
        throw new Error(`Cannot save from agent loop state ${state.status}`);
      }
      return compactState({ ...state, status: 'saving', updatedAt: now, conflict: undefined });
    }
    case 'save_failed': {
      if (state.status !== 'saving') {
        throw new Error(`Cannot record save failure from agent loop state ${state.status}`);
      }
      return compactState({ ...state, status: 'ready_to_save', updatedAt: now });
    }
    case 'save_conflict':
      if (state.status !== 'saving') {
        throw new Error(`Cannot record save conflict from agent loop state ${state.status}`);
      }
      return compactState({
        ...state,
        status: 'conflict',
        updatedAt: now,
        conflict: { currentHeadCommitId: event.currentHeadCommitId },
      });
    case 'save_completed':
      if (state.status !== 'saving') {
        throw new Error(`Cannot complete save from agent loop state ${state.status}`);
      }
      return compactState({
        ...state,
        status: 'complete',
        updatedAt: now,
        completedHeadCommitId: requireNonEmptyString(event.headCommitId, 'headCommitId'),
        conflict: undefined,
      });
  }
}

export function updateLightExtensionAgentLoopBudget(
  state: LightExtensionAgentLoopState,
  budget: Partial<LightExtensionAgentLoopBudget>,
): LightExtensionAgentLoopState {
  return {
    ...state,
    budget: normalizeBudget({ ...state.budget, ...budget }),
  };
}

export function canSaveLightExtensionAgentLoop(
  state: LightExtensionAgentLoopState,
  input: { snapshotId: string; contextHash: string },
): boolean {
  return (
    state.status === 'ready_to_save' &&
    state.snapshotId === input.snapshotId &&
    state.contextHash === input.contextHash &&
    !state.problems.some((problem) => problem.severity === 'error')
  );
}

export function parseLightExtensionAgentLoopState(value: unknown): LightExtensionAgentLoopState {
  if (!isRecord(value) || value.schemaVersion !== LIGHT_EXTENSION_AGENT_LOOP_SCHEMA_VERSION) {
    throw new Error('Invalid Light Extension agent loop state');
  }
  const statuses: LightExtensionAgentLoopStatus[] = [
    'pulled',
    'dirty',
    'checking',
    'check_failed',
    'ready_for_preview',
    'preview_active',
    'runtime_failed',
    'ready_to_save',
    'saving',
    'conflict',
    'complete',
    'needs_attention',
  ];
  if (typeof value.status !== 'string' || !statuses.includes(value.status as LightExtensionAgentLoopStatus)) {
    throw new Error('Invalid Light Extension agent loop status');
  }
  if (!isRecord(value.budget) || !Array.isArray(value.problems) || !Array.isArray(value.lastErrorFingerprintSet)) {
    throw new Error('Invalid Light Extension agent loop budget or problem state');
  }
  const parsed: LightExtensionAgentLoopState = {
    ...(structuredClone(value) as unknown as LightExtensionAgentLoopState),
    schemaVersion: LIGHT_EXTENSION_AGENT_LOOP_SCHEMA_VERSION,
    status: value.status as LightExtensionAgentLoopStatus,
    snapshotId: requireNonEmptyString(value.snapshotId, 'snapshotId'),
    contextHash: requireNonEmptyString(value.contextHash, 'contextHash'),
    baseHeadCommitId:
      value.baseHeadCommitId === null ? null : requireNonEmptyString(value.baseHeadCommitId, 'baseHeadCommitId'),
    startedAt: normalizeTimestamp(requireNonEmptyString(value.startedAt, 'startedAt')),
    updatedAt: normalizeTimestamp(requireNonEmptyString(value.updatedAt, 'updatedAt')),
    checkRounds: normalizeNonNegativeInteger(value.checkRounds, 'checkRounds'),
    repeatedFingerprintRounds: normalizeNonNegativeInteger(
      value.repeatedFingerprintRounds,
      'repeatedFingerprintRounds',
    ),
    lastErrorFingerprintSet: value.lastErrorFingerprintSet.map((item) =>
      requireNonEmptyString(item, 'error fingerprint'),
    ),
    problems: normalizeProblems(value.problems as LightExtensionAgentProblem[]),
    budget: {
      maxCheckRounds: normalizeRequiredPositiveInteger(value.budget.maxCheckRounds, 'maxCheckRounds'),
      maxDurationMs: normalizeRequiredPositiveInteger(value.budget.maxDurationMs, 'maxDurationMs'),
      repeatedFingerprintThreshold: normalizeRequiredPositiveInteger(
        value.budget.repeatedFingerprintThreshold,
        'repeatedFingerprintThreshold',
      ),
    },
  };
  return compactState(parsed);
}

export function encodeLightExtensionPreviewSessionDescriptor(
  descriptor: LightExtensionPreviewSessionDescriptor,
): string {
  const normalized = normalizePreviewSessionDescriptor(descriptor);
  return `${LIGHT_EXTENSION_PREVIEW_SESSION_TOKEN_PREFIX}${encodeBase64Url(JSON.stringify(normalized))}`;
}

export function decodeLightExtensionPreviewSessionDescriptor(value: string): LightExtensionPreviewSessionDescriptor {
  if (!value.startsWith(LIGHT_EXTENSION_PREVIEW_SESSION_TOKEN_PREFIX)) {
    throw new Error('Unsupported Light Extension preview session token');
  }
  const encoded = value.slice(LIGHT_EXTENSION_PREVIEW_SESSION_TOKEN_PREFIX.length);
  let parsed: unknown;
  try {
    parsed = JSON.parse(decodeBase64Url(encoded));
  } catch (error) {
    throw new Error('Invalid Light Extension preview session token', { cause: error });
  }
  return normalizePreviewSessionDescriptor(parsed);
}

function normalizePreviewSessionDescriptor(value: unknown): LightExtensionPreviewSessionDescriptor {
  if (!isRecord(value) || value.schemaVersion !== LIGHT_EXTENSION_PREVIEW_SESSION_DESCRIPTOR_VERSION) {
    throw new Error('Invalid Light Extension preview session descriptor');
  }
  if (!isRecord(value.ownerLocator)) {
    throw new Error('Invalid Light Extension preview owner locator');
  }
  const artifactHash = requireNonEmptyString(value.artifactHash, 'artifactHash');
  if (!/^[a-f0-9]{64}$/u.test(artifactHash)) {
    throw new Error('Invalid Light Extension preview artifact hash');
  }
  return {
    schemaVersion: LIGHT_EXTENSION_PREVIEW_SESSION_DESCRIPTOR_VERSION,
    sessionId: requireNonEmptyString(value.sessionId, 'sessionId'),
    repoId: requireNonEmptyString(value.repoId, 'repoId'),
    entryId: requireNonEmptyString(value.entryId, 'entryId'),
    ownerLocator: structuredClone(value.ownerLocator),
    snapshotId: requireNonEmptyString(value.snapshotId, 'snapshotId'),
    contextHash: requireNonEmptyString(value.contextHash, 'contextHash'),
    artifactHash,
    executionId: requireNonEmptyString(value.executionId, 'executionId'),
  };
}

function normalizeBudget(input: Partial<LightExtensionAgentLoopBudget> | undefined): LightExtensionAgentLoopBudget {
  return {
    maxCheckRounds: normalizePositiveInteger(input?.maxCheckRounds, defaultBudget.maxCheckRounds),
    maxDurationMs: normalizePositiveInteger(input?.maxDurationMs, defaultBudget.maxDurationMs),
    repeatedFingerprintThreshold: normalizePositiveInteger(
      input?.repeatedFingerprintThreshold,
      defaultBudget.repeatedFingerprintThreshold,
    ),
  };
}

function normalizePositiveInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.trunc(value) : fallback;
}

function normalizeRequiredPositiveInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid Light Extension agent loop ${label}`);
  }
  return Math.trunc(value);
}

function normalizeNonNegativeInteger(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid Light Extension agent loop ${label}`);
  }
  return Math.trunc(value);
}

function normalizeTimestamp(value?: string): string {
  if (value && Number.isFinite(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return new Date().toISOString();
}

function getBudgetReason(
  state: LightExtensionAgentLoopState,
  now: string,
): LightExtensionAgentLoopState['needsAttentionReason'] | undefined {
  return state.checkRounds > 0 && Date.parse(now) - Date.parse(state.startedAt) >= state.budget.maxDurationMs
    ? 'max_duration'
    : undefined;
}

function toNeedsAttention(
  state: LightExtensionAgentLoopState,
  reason: NonNullable<LightExtensionAgentLoopState['needsAttentionReason']>,
  now: string,
): LightExtensionAgentLoopState {
  return compactState({ ...state, status: 'needs_attention', updatedAt: now, needsAttentionReason: reason });
}

function assertCurrentIdentity(state: LightExtensionAgentLoopState, snapshotId: string, contextHash: string): void {
  if (state.snapshotId !== snapshotId || state.contextHash !== contextHash) {
    throw new Error('Agent loop event does not match the current snapshot and context hash');
  }
}

function normalizeProblems(problems: readonly LightExtensionAgentProblem[]): LightExtensionAgentProblem[] {
  return problems.map((problem) => ({
    ...problem,
    fingerprint: requireNonEmptyString(problem.fingerprint, 'problem fingerprint'),
    severity: problem.severity === 'warning' ? 'warning' : 'error',
  }));
}

function mergeProblems(
  current: readonly LightExtensionAgentProblem[],
  next: readonly LightExtensionAgentProblem[],
): LightExtensionAgentProblem[] {
  const byFingerprint = new Map<string, LightExtensionAgentProblem>();
  for (const problem of normalizeProblems([...current, ...next])) {
    byFingerprint.set(problem.fingerprint, problem);
  }
  return [...byFingerprint.values()];
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`Light Extension ${label} is required`);
  }
  return value;
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort();
}

function sameStrings(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function normalizeCursor(value: number): number {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function compactState(state: LightExtensionAgentLoopState): LightExtensionAgentLoopState {
  return Object.fromEntries(
    Object.entries(state).filter(([, value]) => value !== undefined),
  ) as unknown as LightExtensionAgentLoopState;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index];
    const second = bytes[index + 1];
    const third = bytes[index + 2];
    const bits = (first << 16) | ((second || 0) << 8) | (third || 0);
    output += alphabet[(bits >> 18) & 63];
    output += alphabet[(bits >> 12) & 63];
    output += second === undefined ? '=' : alphabet[(bits >> 6) & 63];
    output += third === undefined ? '=' : alphabet[bits & 63];
  }
  return output.replace(/\+/gu, '-').replace(/\//gu, '_').replace(/=+$/u, '');
}

function decodeBase64Url(value: string): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const normalized = value.replace(/-/gu, '+').replace(/_/gu, '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const bytes: number[] = [];
  for (let index = 0; index < padded.length; index += 4) {
    const chars = padded.slice(index, index + 4);
    const values = [...chars].map((character) => (character === '=' ? 0 : alphabet.indexOf(character)));
    if (values.some((item) => item < 0)) {
      throw new Error('Invalid base64url content');
    }
    const bits = (values[0] << 18) | (values[1] << 12) | (values[2] << 6) | values[3];
    bytes.push((bits >> 16) & 255);
    if (chars[2] !== '=') bytes.push((bits >> 8) & 255);
    if (chars[3] !== '=') bytes.push(bits & 255);
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bytes));
}
