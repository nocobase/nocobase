/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSExecutionIdentity } from './runjsRuntimeReporter';

export const RUNJS_API_FAILURE_SCHEMA_VERSION = 1 as const;
export const RUNJS_API_FAILURE_REPORTING_CONTEXT = Symbol.for('@nocobase/runjs/api-failure-reporting');

export interface RunJSApiFailureIssue {
  schemaVersion: typeof RUNJS_API_FAILURE_SCHEMA_VERSION;
  type: 'api';
  phase: 'api' | 'permission';
  severity: 'error';
  method: string;
  resource: string;
  action: string;
  status?: number;
  reasonCode?: string;
}

export interface RunJSApiFailureEvent {
  schemaVersion: typeof RUNJS_API_FAILURE_SCHEMA_VERSION;
  identity: RunJSExecutionIdentity;
  issue: RunJSApiFailureIssue;
}

export interface RunJSApiFailureReporter {
  report(event: RunJSApiFailureEvent): void | Promise<void>;
}

export interface RunJSApiFailureReportingOptions {
  identity: RunJSExecutionIdentity;
  reporter: RunJSApiFailureReporter;
}

interface ErrorRecord {
  code?: unknown;
  response?: unknown;
}

export function reportRunJSApiFailure(
  reporting: RunJSApiFailureReportingOptions | undefined,
  input: { method?: unknown; resource: string; action: string; error: unknown },
): void {
  if (!reporting?.reporter || typeof reporting.reporter.report !== 'function') {
    return;
  }
  const status = readStatus(input.error);
  const reasonCode = readReasonCode(input.error);
  const event: RunJSApiFailureEvent = {
    schemaVersion: RUNJS_API_FAILURE_SCHEMA_VERSION,
    identity: sanitizeIdentity(reporting.identity),
    issue: {
      schemaVersion: RUNJS_API_FAILURE_SCHEMA_VERSION,
      type: 'api',
      phase: status === 401 || status === 403 ? 'permission' : 'api',
      severity: 'error',
      method: normalizeMethod(input.method),
      resource: sanitizeIdentifier(input.resource, 512),
      action: sanitizeIdentifier(input.action, 256),
      ...(status ? { status } : {}),
      ...(reasonCode ? { reasonCode } : {}),
    },
  };
  try {
    const result = reporting.reporter.report(event);
    if (result && typeof result.then === 'function') {
      Promise.resolve(result).catch(() => undefined);
    }
  } catch {
    // API failure reporters are observational and must never alter the original request rejection.
  }
}

export function setRunJSApiFailureReporting(target: unknown, reporting?: RunJSApiFailureReportingOptions): void {
  if (!isRecord(target)) {
    return;
  }
  try {
    if (!reporting) {
      delete target[RUNJS_API_FAILURE_REPORTING_CONTEXT];
      return;
    }
    Object.defineProperty(target, RUNJS_API_FAILURE_REPORTING_CONTEXT, {
      configurable: true,
      enumerable: false,
      value: reporting,
      writable: false,
    });
  } catch {
    // Some host proxies reject defineProperty; scoped reporting remains best-effort.
  }
}

export function getRunJSApiFailureReporting(target: unknown): RunJSApiFailureReportingOptions | undefined {
  if (!isRecord(target)) {
    return undefined;
  }
  try {
    const value = target[RUNJS_API_FAILURE_REPORTING_CONTEXT];
    return isRecord(value) ? (value as unknown as RunJSApiFailureReportingOptions) : undefined;
  } catch {
    return undefined;
  }
}

function readStatus(error: unknown): number | undefined {
  const response = isRecord((error as ErrorRecord | undefined)?.response)
    ? ((error as ErrorRecord).response as Record<PropertyKey, unknown>)
    : undefined;
  const status = response?.status;
  return typeof status === 'number' && Number.isFinite(status) ? Math.trunc(status) : undefined;
}

function readReasonCode(error: unknown): string | undefined {
  const errorRecord = isRecord(error) ? error : {};
  const response = isRecord(errorRecord.response) ? errorRecord.response : {};
  const data = isRecord(response.data) ? response.data : {};
  const nestedError = isRecord(data.error) ? data.error : {};
  const errors = Array.isArray(data.errors) ? data.errors : [];
  const firstError = isRecord(errors[0]) ? errors[0] : {};
  return (
    normalizeReasonCode(nestedError.code) ||
    normalizeReasonCode(firstError.code) ||
    normalizeReasonCode(errorRecord.code)
  );
}

function normalizeReasonCode(value: unknown): string | undefined {
  return typeof value === 'string' && /^[A-Za-z0-9._:-]{1,160}$/u.test(value) ? value : undefined;
}

function normalizeMethod(value: unknown): string {
  return typeof value === 'string' && value.trim() ? value.trim().toUpperCase().slice(0, 32) : 'GET';
}

function sanitizeIdentity(identity: RunJSExecutionIdentity): RunJSExecutionIdentity {
  const metadata = identity.metadata
    ? Object.fromEntries(
        Object.entries(identity.metadata)
          .filter(([key]) => !/authorization|cookie|token|api[_-]?key|secret|password/iu.test(key))
          .map(([key, value]) => [
            sanitizeIdentifier(key, 120),
            typeof value === 'string' ? sanitizeIdentifier(value, 512) : value,
          ]),
      )
    : undefined;
  return {
    executionId: sanitizeIdentifier(identity.executionId, 512),
    artifactHash: sanitizeIdentifier(identity.artifactHash, 512),
    sourceURL: sanitizeIdentifier(identity.sourceURL, 512),
    ...(metadata ? { metadata } : {}),
  };
}

function sanitizeIdentifier(value: string, maxLength: number): string {
  return String(value || '')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/giu, 'Bearer [REDACTED]')
    .replace(
      /\b(authorization|cookie|set-cookie|token|access[_-]?token|api[_-]?key|secret|password)\b\s*[:=]\s*([^\s,;]+)/giu,
      '$1=[REDACTED]',
    )
    .replace(/[\r\n\t]/gu, ' ')
    .slice(0, maxLength);
}

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
