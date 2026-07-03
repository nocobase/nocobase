/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export const REDACTED_VALUE = '[REDACTED]';

export const DEFAULT_REDACTED_KEYS = [
  'token',
  'authorization',
  'cookie',
  'set-cookie',
  'api_key',
  'apikey',
  'secret',
  'password',
  'private_key',
  'access_key',
  'accessKeyId',
  'accessKeySecret',
] as const;

const API_CALL_LOG_EXTRA_REDACTED_KEYS = ['prompt'];
const API_CALL_LOG_PROMPT_KEYS = ['message', 'messages', 'content', 'input', 'instructions'];
const EXECUTION_CONFIG_REDACTED_KEYS = ['command', 'commandPath', 'cwd', 'env'];
const ARTIFACT_METADATA_URL_KEYS = ['externalUrl', 'artifactUrl', 'downloadUrl', 'url', 'href'];
const AGENT_GATEWAY_TOKEN_PATTERN = /\bag_(?:inv|node|claim|stream)_[A-Za-z0-9._~+/-]+=*/gi;
const EXTERNAL_URL_PATTERN = /\bhttps?:\/\/[^\s"'<>]+/gi;

export interface RedactionOptions {
  extraKeys?: readonly string[];
  replacement?: string;
  maxStringLength?: number;
}

export interface ApiCallLogSummaryInput {
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  headers?: unknown;
  query?: unknown;
  body?: unknown;
  error?: unknown;
}

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[\s_-]/g, '');
}

function redactedKeySet(extraKeys: readonly string[] = []) {
  return new Set([...DEFAULT_REDACTED_KEYS, ...extraKeys].map(normalizeKey));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function truncateString(value: string, maxStringLength?: number) {
  if (!maxStringLength || value.length <= maxStringLength) {
    return value;
  }
  return `${value.slice(0, maxStringLength)}...`;
}

function isErrorLike(value: object): value is Error & { cause?: unknown } {
  return value instanceof Error;
}

function quoteReplacementLike(rawValue: string, replacement: string) {
  if (rawValue.startsWith('"')) {
    return `"${replacement}"`;
  }
  if (rawValue.startsWith("'")) {
    return `'${replacement}'`;
  }
  return replacement;
}

export function shouldRedactKey(key: string, options: RedactionOptions = {}) {
  const normalizedKey = normalizeKey(key);
  const sensitiveKeyFragments = [
    'token',
    'authorization',
    'cookie',
    'apikey',
    'secret',
    'password',
    'privatekey',
    'accesskey',
    ...(options.extraKeys || []).map(normalizeKey),
  ].filter(Boolean);

  if (redactedKeySet(options.extraKeys).has(normalizedKey)) {
    return true;
  }

  return sensitiveKeyFragments.some((sensitiveKey) => normalizedKey.includes(sensitiveKey));
}

export function redactJson<T>(value: T, options: RedactionOptions = {}): T | string {
  const replacement = options.replacement || REDACTED_VALUE;
  const seen = new WeakSet<object>();

  const redact = (current: unknown): unknown => {
    if (typeof current === 'string') {
      return redactText(current, options);
    }

    if (Array.isArray(current)) {
      return current.map((item) => redact(item));
    }

    if (!current || typeof current !== 'object') {
      return current;
    }

    if (seen.has(current)) {
      return '[Circular]';
    }
    seen.add(current);

    if (!isPlainObject(current)) {
      const redacted: Record<string, unknown> = {};

      if (isErrorLike(current)) {
        redacted.name = current.name;
        redacted.message = redactText(current.message, options);
        if (current.stack) {
          redacted.stack = redactText(current.stack, options);
        }
        if (current.cause !== undefined) {
          redacted.cause = redact(current.cause);
        }
      }

      for (const [key, entryValue] of Object.entries(current)) {
        redacted[key] = shouldRedactKey(key, options) ? replacement : redact(entryValue);
      }

      return Object.keys(redacted).length > 0 ? redacted : current;
    }

    const redacted: Record<string, unknown> = {};
    for (const [key, entryValue] of Object.entries(current)) {
      redacted[key] = shouldRedactKey(key, options) ? replacement : redact(entryValue);
    }
    return redacted;
  };

  return redact(value) as T | string;
}

export function redactText(value: string, options: RedactionOptions = {}) {
  const replacement = options.replacement || REDACTED_VALUE;
  const keyValuePattern =
    /(["']?)([A-Za-z][A-Za-z0-9_.-]*)(\1)(\s*[:=]\s*)("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,;&{}\r\n]+)/gi;

  return truncateString(
    value
      .replace(/\b(Authorization|Cookie|Set-Cookie)\s*[:=]\s*[^\r\n]+/gi, `$1: ${replacement}`)
      .replace(AGENT_GATEWAY_TOKEN_PATTERN, replacement)
      .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, `Bearer ${replacement}`)
      .replace(
        keyValuePattern,
        (match, keyQuote: string, key: string, _closingQuote: string, separator: string, rawValue: string) =>
          shouldRedactKey(key, options)
            ? `${keyQuote}${key}${keyQuote}${separator}${quoteReplacementLike(rawValue, replacement)}`
            : match,
      ),
    options.maxStringLength,
  );
}

function redactExternalUrlStrings(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(EXTERNAL_URL_PATTERN, REDACTED_VALUE);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactExternalUrlStrings(item));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, entryValue] of Object.entries(value)) {
    redacted[key] = redactExternalUrlStrings(entryValue);
  }
  return redacted;
}

export function redactObservabilityText(value: string) {
  return redactText(value, {
    extraKeys: EXECUTION_CONFIG_REDACTED_KEYS,
  });
}

export function redactEventPayload(payload: unknown) {
  return redactJson(payload, {
    extraKeys: EXECUTION_CONFIG_REDACTED_KEYS,
  });
}

export function redactArtifactText(contentText: string) {
  return redactObservabilityText(contentText);
}

export function redactArtifactMetadata(metadata: unknown) {
  const redactedMetadata = redactJson(metadata, {
    extraKeys: [...EXECUTION_CONFIG_REDACTED_KEYS, ...ARTIFACT_METADATA_URL_KEYS],
  });
  return redactExternalUrlStrings(redactedMetadata);
}

export function redactSnapshotJson(snapshot: unknown) {
  return redactJson(snapshot, {
    extraKeys: EXECUTION_CONFIG_REDACTED_KEYS,
  });
}

export function redactDaemonErrorSummary(errorSummary: string) {
  return redactText(errorSummary, {
    extraKeys: EXECUTION_CONFIG_REDACTED_KEYS,
  });
}

export function redactRunResultSummary(summary: unknown) {
  return redactJson(summary, {
    extraKeys: EXECUTION_CONFIG_REDACTED_KEYS,
  });
}

export function redactRunErrorSummary(errorSummary: string) {
  return redactText(errorSummary, {
    extraKeys: EXECUTION_CONFIG_REDACTED_KEYS,
  });
}

export function createApiCallLogSummary(input: ApiCallLogSummaryInput) {
  const options: RedactionOptions = {
    extraKeys: [...API_CALL_LOG_EXTRA_REDACTED_KEYS, ...API_CALL_LOG_PROMPT_KEYS, ...EXECUTION_CONFIG_REDACTED_KEYS],
    maxStringLength: 2000,
  };

  return {
    method: input.method,
    path: input.path ? redactText(input.path, options) : input.path,
    statusCode: input.statusCode,
    durationMs: input.durationMs,
    headers: redactJson(input.headers || {}, options),
    query: redactJson(input.query || {}, options),
    body: redactJson(input.body || {}, options),
    error: typeof input.error === 'string' ? redactText(input.error, options) : redactJson(input.error || {}, options),
  };
}
