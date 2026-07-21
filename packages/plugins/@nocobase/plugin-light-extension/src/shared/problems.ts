/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type {
  LightExtensionProblem,
  LightExtensionProblemPhase,
  LightExtensionProblemProvenance,
  LightExtensionProblemSource,
} from './types';

const redactedValue = '[REDACTED]';
const redactedPath = '[REDACTED_PATH]';
const maxStackLength = 8 * 1024;
const maxDetailStringLength = 2 * 1024;
const maxDetailsSerializedLength = 16 * 1024;
const maxDetailsDepth = 8;
const maxDetailsKeys = 100;
const maxDetailsArrayLength = 100;
const sensitiveDetailKeyPattern =
  /^(?:authorization|cookie|set-cookie|token|access[_-]?token|refresh[_-]?token|api[_-]?key|secret|password|request[_-]?body|response[_-]?body|body|payload|raw[_-]?error)$/iu;
const unixAbsolutePathPattern = /(^|[\s"'(`])\/(?:[^\s"'`)]+\/)*[^\s"'`)]+/gu;
const windowsAbsolutePathPattern = /\b[A-Za-z]:\\(?:[^\s"'`)]+\\)*[^\s"'`)]+/gu;

export type CreateLightExtensionProblemInput = Omit<
  LightExtensionProblem,
  'schemaVersion' | 'fingerprint' | 'details' | 'stack' | 'provenance'
> & {
  details?: Record<string, unknown>;
  stack?: string;
  provenance?: LightExtensionProblemProvenance[];
};

export interface LightExtensionProblemFactoryContext {
  snapshotId: string;
  requestId: string;
  source: LightExtensionProblemSource;
  phase?: LightExtensionProblemPhase;
}

export type LightExtensionProblemFactoryInput = Omit<
  CreateLightExtensionProblemInput,
  'snapshotId' | 'requestId' | 'source' | 'phase'
> & {
  source?: LightExtensionProblemSource;
  phase?: LightExtensionProblemPhase;
};

export function createLightExtensionProblem(input: CreateLightExtensionProblemInput): LightExtensionProblem {
  const details = sanitizeLightExtensionProblemDetails(input.details);
  const stack = sanitizeLightExtensionProblemStack(input.stack);
  const problemWithoutFingerprint: Omit<LightExtensionProblem, 'fingerprint'> = compactRecord({
    ...input,
    schemaVersion: 1,
    path: normalizeProblemPath(input.path),
    range: normalizeProblemRange(input.range),
    stack,
    details,
    provenance: normalizeProvenance(input.provenance),
  });

  return {
    ...problemWithoutFingerprint,
    fingerprint: computeLightExtensionProblemFingerprint(problemWithoutFingerprint),
  };
}

export function createLightExtensionProblemFactory(
  context: LightExtensionProblemFactoryContext,
): (input: LightExtensionProblemFactoryInput) => LightExtensionProblem {
  return (input) =>
    createLightExtensionProblem({
      ...input,
      snapshotId: context.snapshotId,
      requestId: context.requestId,
      source: input.source || context.source,
      phase: input.phase || context.phase || 'infrastructure',
    });
}

export function computeLightExtensionProblemFingerprint(
  problem: Omit<LightExtensionProblem, 'fingerprint'> | LightExtensionProblem,
): string {
  const serialized = stableSerializeLightExtensionProblemValue({
    schemaVersion: problem.schemaVersion,
    phase: problem.phase,
    severity: problem.severity,
    code: problem.code,
    message: problem.message,
    path: problem.path || null,
    range: problem.range || null,
    kind: problem.kind || null,
    entryName: problem.entryName || null,
    fixHint: problem.fixHint || null,
    details: sanitizeLightExtensionProblemDetails(problem.details) || null,
  });
  return `problem-v1:fnv1a-${fnv1a(serialized)}`;
}

export function sanitizeLightExtensionProblemDetails(
  details: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!details) {
    return undefined;
  }

  const sanitized = sanitizeDetailValue(details, 0, new WeakSet<object>());
  if (!isPlainRecord(sanitized) || Object.keys(sanitized).length === 0) {
    return undefined;
  }
  const serialized = stableSerializeLightExtensionProblemValue(sanitized);
  if (serialized.length <= maxDetailsSerializedLength) {
    return sanitized;
  }
  return {
    truncated: true,
    originalLength: serialized.length,
    contentFingerprint: `fnv1a-${fnv1a(serialized)}`,
    preview: serialized.slice(0, maxDetailsSerializedLength / 2),
  };
}

export function sanitizeLightExtensionProblemStack(stack: string | undefined): string | undefined {
  if (!stack) {
    return undefined;
  }
  return redactSensitiveText(stack).slice(0, maxStackLength);
}

export function stableSerializeLightExtensionProblemValue(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'string' || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? JSON.stringify(value) : JSON.stringify(String(value));
  }
  if (typeof value === 'bigint') {
    return JSON.stringify(`${value.toString()}n`);
  }
  if (typeof value === 'undefined') {
    return 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableSerializeLightExtensionProblemValue).join(',')}]`;
  }
  if (isPlainRecord(value)) {
    return `{${Object.keys(value)
      .filter((key) => typeof value[key] !== 'undefined')
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableSerializeLightExtensionProblemValue(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(String(value));
}

export function sortLightExtensionProblems(problems: readonly LightExtensionProblem[]): LightExtensionProblem[] {
  return [...problems].sort((left, right) => problemSortKey(left).localeCompare(problemSortKey(right)));
}

export function uniqueLightExtensionProblems(problems: readonly LightExtensionProblem[]): LightExtensionProblem[] {
  const byFingerprint = new Map<string, LightExtensionProblem>();
  for (const problem of problems) {
    const existing = byFingerprint.get(problem.fingerprint);
    if (!existing) {
      byFingerprint.set(problem.fingerprint, problem);
      continue;
    }
    byFingerprint.set(problem.fingerprint, {
      ...existing,
      provenance: mergeProvenance(existing, problem),
    });
  }
  return sortLightExtensionProblems([...byFingerprint.values()]);
}

function sanitizeDetailValue(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (depth > maxDetailsDepth) {
    return '[TRUNCATED]';
  }
  if (typeof value === 'string') {
    return redactSensitiveText(value).slice(0, maxDetailStringLength);
  }
  if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
    return value;
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactSensitiveText(value.message).slice(0, maxDetailStringLength),
    };
  }
  if (Array.isArray(value)) {
    return value.slice(0, maxDetailsArrayLength).map((item) => sanitizeDetailValue(item, depth + 1, seen));
  }
  if (!isPlainRecord(value)) {
    return String(value).slice(0, maxDetailStringLength);
  }
  if (seen.has(value)) {
    return '[CIRCULAR]';
  }
  seen.add(value);
  const sanitized = Object.fromEntries(
    Object.keys(value)
      .sort()
      .slice(0, maxDetailsKeys)
      .map((key) => [
        key,
        sensitiveDetailKeyPattern.test(key) ? redactedValue : sanitizeDetailValue(value[key], depth + 1, seen),
      ]),
  );
  seen.delete(value);
  return sanitized;
}

function redactSensitiveText(value: string): string {
  return value
    .replace(/\b(Authorization|Cookie|Set-Cookie)\s*:\s*[^\r\n]+/giu, `$1: ${redactedValue}`)
    .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]+/giu, `$1 ${redactedValue}`)
    .replace(/\b(access[_-]?token|refresh[_-]?token|token)\s*[=:]\s*[^\s,;}&]+/giu, `$1=${redactedValue}`)
    .replace(windowsAbsolutePathPattern, redactedPath)
    .replace(unixAbsolutePathPattern, `$1${redactedPath}`);
}

function normalizeProblemPath(path: string | undefined): string | undefined {
  if (!path) {
    return undefined;
  }
  return path.replace(/\\/gu, '/').replace(/^\.\/+/, '');
}

function normalizeProblemRange(range: LightExtensionProblem['range']): LightExtensionProblem['range'] {
  if (!range) {
    return undefined;
  }
  const start = normalizePosition(range.start);
  const end = range.end ? normalizePosition(range.end) : undefined;
  return compactRecord({ start, end });
}

function normalizePosition(position: { line: number; column: number }): { line: number; column: number } {
  return {
    line: Math.max(1, Math.trunc(position.line)),
    column: Math.max(1, Math.trunc(position.column)),
  };
}

function normalizeProvenance(
  provenance: LightExtensionProblemProvenance[] | undefined,
): LightExtensionProblemProvenance[] | undefined {
  if (!provenance?.length) {
    return undefined;
  }
  const seen = new Set<string>();
  return provenance.filter((item) => {
    const key = `${item.source}\u0000${item.phase}\u0000${item.requestId}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function mergeProvenance(left: LightExtensionProblem, right: LightExtensionProblem): LightExtensionProblemProvenance[] {
  return (
    normalizeProvenance([
      ...(left.provenance || []),
      { source: left.source, phase: left.phase, requestId: left.requestId },
      ...(right.provenance || []),
      { source: right.source, phase: right.phase, requestId: right.requestId },
    ]) || []
  );
}

function problemSortKey(problem: LightExtensionProblem): string {
  return [
    problem.path || '',
    String(problem.range?.start.line || 0).padStart(8, '0'),
    String(problem.range?.start.column || 0).padStart(8, '0'),
    problem.phase,
    problem.severity,
    problem.code,
    problem.message,
    problem.fingerprint,
  ].join('\u0000');
}

function fnv1a(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function compactRecord<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => typeof value !== 'undefined' && value !== null),
  ) as T;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
