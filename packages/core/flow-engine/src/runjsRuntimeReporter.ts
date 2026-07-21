/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { parseRunJSStackFrames } from '@nocobase/runjs/compiler/line-map';

export const RUNJS_RUNTIME_ISSUE_SCHEMA_VERSION = 1 as const;
export const RUNJS_RUNTIME_REPORTING_CONTEXT = Symbol.for('@nocobase/runjs/runtime-reporting');

const MAX_RUNTIME_MESSAGE_CHARS = 1_000;
const MAX_RUNTIME_STACK_CHARS = 4_000;
const MAX_IDENTITY_VALUE_CHARS = 512;

export type RunJSExecutionMetadataValue = string | number | boolean | null;

export interface RunJSExecutionIdentity {
  executionId: string;
  artifactHash: string;
  sourceURL: string;
  metadata?: Readonly<Record<string, RunJSExecutionMetadataValue>>;
}

export type RunJSRuntimeIssueRuleId =
  | 'runtime-error'
  | 'promise-rejection'
  | 'timeout'
  | 'react-error'
  | 'preview-start-failed'
  | 'internal';

export interface RunJSRuntimeIssue {
  schemaVersion: typeof RUNJS_RUNTIME_ISSUE_SCHEMA_VERSION;
  type: 'runtime';
  phase: 'runtime' | 'react';
  severity: 'error';
  ruleId: RunJSRuntimeIssueRuleId;
  message: string;
  errorName?: string;
  generatedLocation?: {
    sourceURL: string;
    line: number;
    column: number;
  };
  sourcePath?: string;
  location?: {
    start: { line: number; column: number };
  };
  stack?: string;
  executionMayContinue?: boolean;
  details?: Readonly<Record<string, RunJSExecutionMetadataValue>>;
}

export interface RunJSRuntimeEvent {
  schemaVersion: typeof RUNJS_RUNTIME_ISSUE_SCHEMA_VERSION;
  identity: RunJSExecutionIdentity;
  issue: RunJSRuntimeIssue;
}

export interface RunJSRuntimeReporter {
  report(event: RunJSRuntimeEvent): void | Promise<void>;
}

export interface RunJSRuntimeReportingOptions {
  identity: RunJSExecutionIdentity;
  reporter: RunJSRuntimeReporter;
}

export type RunJSRuntimeIssueInput =
  | { kind: 'runtime-error'; error: unknown }
  | { kind: 'promise-rejection'; error: unknown }
  | { kind: 'timeout'; timeoutMs: number }
  | { kind: 'react-error'; error: unknown; componentStack?: string };

interface ErrorLike {
  name?: unknown;
  message?: unknown;
  stack?: unknown;
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return Boolean(value) && (typeof value === 'object' || typeof value === 'function');
}

function clampText(value: string, maxChars: number): string {
  if (value.length <= maxChars) {
    return value;
  }
  return `${value.slice(0, Math.max(0, maxChars - 16))}... [truncated]`;
}

function sanitizeRuntimeText(value: string, maxChars: number): string {
  let output = String(value || '');
  const protectedURLs: string[] = [];
  const protectURL = (url: string) => {
    const placeholder = `RUNJS_PROTECTED_URL_${protectedURLs.length}_PLACEHOLDER`;
    protectedURLs.push(url);
    return placeholder;
  };
  output = output.replace(/nocobase-runjs:\/\/bundle\/[A-Za-z0-9._~-]+/gu, protectURL);
  output = output.replace(/https?:\/\/[^\s)]+/giu, (rawURL) => {
    try {
      const url = new URL(rawURL);
      url.username = '';
      url.password = '';
      url.search = '';
      url.hash = '';
      return protectURL(url.toString());
    } catch {
      return '[url]';
    }
  });
  output = output.replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/giu, 'Bearer [REDACTED]');
  output = output.replace(
    /\b(authorization|cookie|set-cookie|token|access[_-]?token|api[_-]?key|secret|password)\b\s*[:=]\s*([^\s,;]+)/giu,
    '$1=[REDACTED]',
  );
  output = output.replace(
    /\b(request\s*body|response\s*body|payload)\b\s*[:=]\s*(\{[^\n]*\}|\[[^\n]*\]|[^\n]+)/giu,
    '$1=[REDACTED]',
  );
  output = output.replace(/file:\/\/[^\s)]+/giu, '[absolute-path]');
  output = output.replace(/(?<![A-Za-z0-9])[A-Za-z]:[\\/][^\s):]+/gu, '[absolute-path]');
  output = output.replace(/(?<![:/])\/(?:[^/\s):]+\/)*[^/\s):]+/gu, '[absolute-path]');
  output = output.replace(/RUNJS_PROTECTED_URL_(\d+)_PLACEHOLDER/gu, (_placeholder, index: string) => {
    return protectedURLs[Number(index)] || '';
  });
  return clampText(output, maxChars);
}

function getErrorLike(error: unknown): ErrorLike {
  return isRecord(error) ? error : {};
}

function safeErrorName(error: unknown): string | undefined {
  const name = getErrorLike(error).name;
  return typeof name === 'string' && name ? sanitizeRuntimeText(name, 120) : undefined;
}

function safeErrorMessage(error: unknown): string {
  const errorLike = getErrorLike(error);
  if (typeof errorLike.message === 'string' && errorLike.message) {
    return sanitizeRuntimeText(errorLike.message, MAX_RUNTIME_MESSAGE_CHARS);
  }
  if (typeof error === 'string') {
    return sanitizeRuntimeText(error, MAX_RUNTIME_MESSAGE_CHARS);
  }
  if (typeof error === 'number' || typeof error === 'boolean' || typeof error === 'bigint') {
    return String(error);
  }
  return 'Unknown RunJS runtime error';
}

function safeErrorStack(error: unknown, componentStack?: string): string | undefined {
  const stack = getErrorLike(error).stack;
  const parts = [typeof stack === 'string' ? stack : '', componentStack || ''].filter(Boolean);
  if (!parts.length) {
    return undefined;
  }
  return sanitizeRuntimeText(parts.join('\n'), MAX_RUNTIME_STACK_CHARS);
}

function sanitizeIdentity(identity: RunJSExecutionIdentity): RunJSExecutionIdentity {
  const metadata = identity.metadata
    ? Object.fromEntries(
        Object.entries(identity.metadata).map(([key, value]) => [
          sanitizeRuntimeText(key, 120),
          /authorization|cookie|token|api[_-]?key|secret|password/iu.test(key)
            ? '[REDACTED]'
            : typeof value === 'string'
              ? sanitizeRuntimeText(value, MAX_IDENTITY_VALUE_CHARS)
              : value,
        ]),
      )
    : undefined;
  return {
    executionId: sanitizeRuntimeText(identity.executionId, MAX_IDENTITY_VALUE_CHARS),
    artifactHash: sanitizeRuntimeText(identity.artifactHash, MAX_IDENTITY_VALUE_CHARS),
    sourceURL: sanitizeRuntimeText(identity.sourceURL, MAX_IDENTITY_VALUE_CHARS),
    ...(metadata ? { metadata } : {}),
  };
}

function sanitizeDetails(
  details: Readonly<Record<string, RunJSExecutionMetadataValue>> | undefined,
): Readonly<Record<string, RunJSExecutionMetadataValue>> | undefined {
  if (!details) {
    return undefined;
  }
  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => [
      sanitizeRuntimeText(key, 120),
      /authorization|cookie|token|api[_-]?key|secret|password|body|payload/iu.test(key)
        ? '[REDACTED]'
        : typeof value === 'string'
          ? sanitizeRuntimeText(value, MAX_IDENTITY_VALUE_CHARS)
          : value,
    ]),
  );
}

function sanitizeRuntimeIssue(issue: RunJSRuntimeIssue): RunJSRuntimeIssue {
  const details = sanitizeDetails(issue.details);
  return {
    ...issue,
    message: sanitizeRuntimeText(issue.message, MAX_RUNTIME_MESSAGE_CHARS),
    ...(issue.errorName ? { errorName: sanitizeRuntimeText(issue.errorName, 120) } : {}),
    ...(issue.stack ? { stack: sanitizeRuntimeText(issue.stack, MAX_RUNTIME_STACK_CHARS) } : {}),
    ...(issue.sourcePath ? { sourcePath: sanitizeRuntimeText(issue.sourcePath, MAX_IDENTITY_VALUE_CHARS) } : {}),
    ...(issue.generatedLocation
      ? {
          generatedLocation: {
            ...issue.generatedLocation,
            sourceURL: sanitizeRuntimeText(issue.generatedLocation.sourceURL, MAX_IDENTITY_VALUE_CHARS),
          },
        }
      : {}),
    ...(details ? { details } : {}),
  };
}

function getGeneratedLocation(stack: string | undefined, sourceURL: string) {
  if (!stack || !sourceURL) {
    return undefined;
  }
  const frame = parseRunJSStackFrames(stack).find((candidate) => candidate.url === sourceURL);
  if (!frame) {
    return undefined;
  }
  return {
    sourceURL,
    line: frame.line,
    column: frame.column,
  };
}

export function createRunJSRuntimeIssue(
  input: RunJSRuntimeIssueInput,
  identity?: Pick<RunJSExecutionIdentity, 'sourceURL'>,
): RunJSRuntimeIssue {
  if (input.kind === 'timeout') {
    return {
      schemaVersion: RUNJS_RUNTIME_ISSUE_SCHEMA_VERSION,
      type: 'runtime',
      phase: 'runtime',
      severity: 'error',
      ruleId: 'timeout',
      message: 'Execution timed out',
      executionMayContinue: true,
      details: { timeoutMs: Math.max(0, Math.floor(input.timeoutMs)) },
    };
  }

  const stack = safeErrorStack(input.error, input.kind === 'react-error' ? input.componentStack : undefined);
  const generatedLocation = getGeneratedLocation(stack, identity?.sourceURL || '');
  const errorName = safeErrorName(input.error);
  return {
    schemaVersion: RUNJS_RUNTIME_ISSUE_SCHEMA_VERSION,
    type: 'runtime',
    phase: input.kind === 'react-error' ? 'react' : 'runtime',
    severity: 'error',
    ruleId: input.kind,
    message: safeErrorMessage(input.error),
    ...(errorName ? { errorName } : {}),
    ...(generatedLocation ? { generatedLocation } : {}),
    ...(stack ? { stack } : {}),
  };
}

export function reportRunJSRuntimeIssue(
  reporting: RunJSRuntimeReportingOptions | undefined,
  issue: RunJSRuntimeIssue,
): void {
  if (!reporting || !reporting.reporter || typeof reporting.reporter.report !== 'function') {
    return;
  }
  const event: RunJSRuntimeEvent = {
    schemaVersion: RUNJS_RUNTIME_ISSUE_SCHEMA_VERSION,
    identity: sanitizeIdentity(reporting.identity),
    issue: sanitizeRuntimeIssue(issue),
  };
  try {
    const result = reporting.reporter.report(event);
    if (result && typeof result.then === 'function') {
      Promise.resolve(result).catch(() => undefined);
    }
  } catch {
    // Runtime reporters are observational. Their failures must never alter RunJS execution or fallback rendering.
  }
}

export function setRunJSRuntimeReporting(target: unknown, reporting?: RunJSRuntimeReportingOptions): void {
  if (!isRecord(target)) {
    return;
  }
  try {
    if (!reporting) {
      delete target[RUNJS_RUNTIME_REPORTING_CONTEXT];
      return;
    }
    Object.defineProperty(target, RUNJS_RUNTIME_REPORTING_CONTEXT, {
      configurable: true,
      enumerable: false,
      value: reporting,
      writable: false,
    });
  } catch {
    // Some host proxies may reject defineProperty. Reporter propagation remains best-effort and scoped.
  }
}

export function getRunJSRuntimeReporting(target: unknown): RunJSRuntimeReportingOptions | undefined {
  if (!isRecord(target)) {
    return undefined;
  }
  try {
    const value = target[RUNJS_RUNTIME_REPORTING_CONTEXT];
    return isRecord(value) ? (value as unknown as RunJSRuntimeReportingOptions) : undefined;
  } catch {
    return undefined;
  }
}
