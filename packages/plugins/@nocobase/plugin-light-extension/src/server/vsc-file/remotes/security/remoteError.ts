/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RemoteSyncErrorCode } from '../../../../shared/vsc-file/remote-sync-types';
import { RemoteSyncError, type RemoteSyncErrorDetails } from '../RemoteSyncAdapter';

export interface RemoteProviderErrorContext {
  provider: string;
  operation?: string;
}

interface RemoteProviderSafeErrorDetails extends RemoteSyncErrorDetails {
  httpStatus?: number;
}

export function mapRemoteProviderError(error: unknown, context: RemoteProviderErrorContext): RemoteSyncError {
  if (error instanceof RemoteSyncError) {
    return rebuildRemoteSyncError(error, context);
  }

  const response = toRecord(getRecordProperty(error, 'response'));
  const status = toFiniteNumber(response.status);
  const requestId = toSafeIdentifier(
    readHeader(response.headers, 'x-github-request-id') || readHeader(response.headers, 'x-request-id'),
  );
  const rateLimitReset = toRateLimitValue(readHeader(response.headers, 'x-ratelimit-reset'));
  const retryAfterSeconds = toFiniteNumber(readHeader(response.headers, 'retry-after'));
  const rateLimitRemaining = readHeader(response.headers, 'x-ratelimit-remaining');
  const details = compactDetails({
    provider: context.provider,
    operation: context.operation,
    requestId,
    rateLimitReset,
    retryAfterSeconds,
    httpStatus: status,
  });

  if (status === 401) {
    return createSafeError('AUTH_FAILED', 'Remote authentication failed', 'auth-failed', details);
  }
  if (status === 403 && (String(rateLimitRemaining) === '0' || rateLimitReset !== undefined)) {
    return createSafeError('RATE_LIMITED', 'Remote provider rate limit was exceeded', 'rate-limited', details);
  }
  if (status === 403) {
    return createSafeError('PERMISSION_DENIED', 'Remote provider denied the operation', 'permission-denied', details);
  }
  if (status === 404) {
    return createSafeError('REMOTE_NOT_FOUND', 'Remote target was not found', 'remote-not-found', details);
  }
  if (status === 409) {
    return createSafeError(
      'REMOTE_CHANGED',
      'Remote target changed before the operation completed',
      'remote-changed',
      details,
    );
  }
  if (status === 422) {
    return createSafeError(
      'UNSAFE_CONTENT',
      'Remote provider rejected the requested content',
      'content-rejected',
      details,
    );
  }
  if (status === 429) {
    return createSafeError('RATE_LIMITED', 'Remote provider rate limit was exceeded', 'rate-limited', details);
  }
  if (status !== undefined && status >= 500) {
    return createSafeError('REMOTE_UNAVAILABLE', 'Remote provider is unavailable', 'provider-unavailable', details);
  }

  const errorCode = toNonEmptyString(getRecordProperty(error, 'code'));
  if (errorCode === 'ECONNABORTED' || errorCode === 'ETIMEDOUT') {
    return createSafeError('REMOTE_UNAVAILABLE', 'Remote request timed out', 'network-timeout', details);
  }

  const message = toNonEmptyString(getRecordProperty(error, 'message'));
  if (message && isNetworkBlockedMessage(message)) {
    return createSafeError(
      'REMOTE_UNAVAILABLE',
      'Remote request was blocked by network policy',
      'network-blocked',
      details,
    );
  }

  return createSafeError('REMOTE_UNAVAILABLE', 'Remote provider is unavailable', 'network-error', details);
}

function rebuildRemoteSyncError(error: RemoteSyncError, context: RemoteProviderErrorContext): RemoteSyncError {
  const definition = getSafeErrorDefinition(error.code);
  const sourceDetails = toRecord(error.details);
  const details = compactDetails({
    provider: context.provider,
    operation: context.operation,
    requestId: toSafeIdentifier(sourceDetails.requestId),
    rateLimitReset: toRateLimitValue(sourceDetails.rateLimitReset),
    retryAfterSeconds: toFiniteNumber(sourceDetails.retryAfterSeconds),
    httpStatus: toFiniteNumber(sourceDetails.httpStatus),
  });
  const sourceReasonCode = toSafeReasonCode(sourceDetails.reasonCode);
  return createSafeError(definition.code, definition.message, sourceReasonCode || definition.reasonCode, details);
}

function getSafeErrorDefinition(code: RemoteSyncErrorCode): {
  code: RemoteSyncErrorCode;
  message: string;
  reasonCode: string;
} {
  switch (code) {
    case 'UNSUPPORTED_PROVIDER':
      return { code, message: 'Remote provider is unsupported', reasonCode: 'unsupported-provider' };
    case 'CREDENTIAL_UNAVAILABLE':
      return { code, message: 'Remote credential is unavailable', reasonCode: 'credential-unavailable' };
    case 'AUTH_FAILED':
      return { code, message: 'Remote authentication failed', reasonCode: 'auth-failed' };
    case 'REMOTE_NOT_FOUND':
      return { code, message: 'Remote target was not found', reasonCode: 'remote-not-found' };
    case 'RATE_LIMITED':
      return { code, message: 'Remote provider rate limit was exceeded', reasonCode: 'rate-limited' };
    case 'REMOTE_CHANGED':
      return { code, message: 'Remote target changed before the operation completed', reasonCode: 'remote-changed' };
    case 'DIVERGED':
      return { code, message: 'Remote and local content diverged', reasonCode: 'diverged' };
    case 'BUSY':
      return { code, message: 'Remote synchronization is busy', reasonCode: 'busy' };
    case 'UNSAFE_CONTENT':
      return { code, message: 'Remote provider rejected the requested content', reasonCode: 'content-rejected' };
    case 'REMOTE_UNAVAILABLE':
      return { code, message: 'Remote provider is unavailable', reasonCode: 'provider-unavailable' };
    case 'PERMISSION_DENIED':
      return { code, message: 'Remote provider denied the operation', reasonCode: 'permission-denied' };
    case 'REPO_ARCHIVED':
      return { code, message: 'Local repository is archived', reasonCode: 'repo-archived' };
    case 'LOCAL_OUTDATED':
      return { code, message: 'Local repository changed before the operation completed', reasonCode: 'local-outdated' };
    case 'CONFIG_INVALID':
      return { code, message: 'Remote request configuration is invalid', reasonCode: 'config-invalid' };
    case 'AUTH_REF_INVALID':
      return { code, message: 'Remote credential reference is invalid', reasonCode: 'auth-ref-invalid' };
  }
}

function createSafeError(
  code: RemoteSyncErrorCode,
  message: string,
  reasonCode: string,
  details: RemoteProviderSafeErrorDetails,
): RemoteSyncError {
  return new RemoteSyncError(code, message, {
    details: {
      ...details,
      reasonCode,
    },
  });
}

function compactDetails(details: RemoteProviderSafeErrorDetails): RemoteProviderSafeErrorDetails {
  return Object.fromEntries(
    Object.entries(details).filter(([, value]) => value !== undefined),
  ) as RemoteProviderSafeErrorDetails;
}

function readHeader(headers: unknown, name: string): unknown {
  if (!headers || typeof headers !== 'object') {
    return undefined;
  }

  const headerGetter = Reflect.get(headers, 'get');
  if (typeof headerGetter === 'function') {
    try {
      const value = Reflect.apply(headerGetter, headers, [name]);
      if (value !== undefined && value !== null) {
        return value;
      }
    } catch {
      return undefined;
    }
  }

  const normalizedName = name.toLowerCase();
  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === normalizedName) {
      return value;
    }
  }
  return undefined;
}

function getRecordProperty(value: unknown, key: string): unknown {
  if (!value || typeof value !== 'object') {
    return undefined;
  }
  return Reflect.get(value, key);
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function toFiniteNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value ? value : undefined;
}

function toRateLimitValue(value: unknown): string | number | undefined {
  if (typeof value === 'string' && /^\d+$/u.test(value)) {
    return value;
  }
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function toSafeIdentifier(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value || value.length > 256 || isSensitiveString(value)) {
    return undefined;
  }
  return /^[A-Za-z0-9._:-]+$/u.test(value) ? value : undefined;
}

function toSafeReasonCode(value: unknown): string | undefined {
  return typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,63}$/u.test(value) ? value : undefined;
}

function isSensitiveString(value: string): boolean {
  return (
    /(token|authorization|password|secret|credential|private[\s_-]?key)/i.test(value) ||
    /\bgh[pousr]_[A-Za-z0-9]{20,}\b/u.test(value) ||
    /\bgithub_pat_[A-Za-z0-9_]{20,}\b/u.test(value)
  );
}

function isNetworkBlockedMessage(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('server_request_whitelist') ||
    normalized.includes('blocked') ||
    normalized.includes('url scheme')
  );
}
