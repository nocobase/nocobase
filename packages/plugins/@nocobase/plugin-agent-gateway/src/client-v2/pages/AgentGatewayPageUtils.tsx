/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Tag, Typography } from 'antd';
import React from 'react';

export interface AgentGatewayApiResponse<T> {
  data?: {
    data?: T;
    meta?: Record<string, unknown>;
  };
}

export interface AgentGatewayApi {
  request<T>(config: {
    url: string;
    method: 'get' | 'post';
    data?: Record<string, unknown>;
    params?: Record<string, unknown>;
  }): Promise<AgentGatewayApiResponse<T>>;
}

export interface AgentGatewayContext {
  api: AgentGatewayApi;
  router?: {
    navigate(path: string): void;
  };
  message?: {
    success(content: string): void;
    error(content: string): void;
  };
}

export type JsonRecord = Record<string, unknown>;

const REDACTED_VALUE = '[REDACTED]';
const AGENT_GATEWAY_TOKEN_PATTERN = /\bag_(?:inv|node|claim|stream)_[A-Za-z0-9._~+/-]+=*/gi;
const EXTERNAL_URL_PATTERN = /\bhttps?:\/\/[^\s"'<>]+/gi;
const REDACTED_KEY_FRAGMENTS = [
  'token',
  'authorization',
  'cookie',
  'apikey',
  'secret',
  'password',
  'privatekey',
  'accesskey',
  'command',
  'commandpath',
  'cwd',
  'env',
];
const EXTERNAL_URL_KEY_FRAGMENTS = ['url', 'href'];

export function getResponseData<T>(response: AgentGatewayApiResponse<T>, fallback: T) {
  return response.data?.data ?? fallback;
}

export function getRequiredResponseData<T>(response: AgentGatewayApiResponse<T>, message: string) {
  const data = response.data?.data;
  if (data === undefined || data === null) {
    throw new Error(message);
  }
  return data;
}

export function getObjectRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' ? (value as JsonRecord) : {};
}

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[\s_.-]/g, '');
}

function shouldRedactPreviewKey(key: string) {
  const normalizedKey = normalizeKey(key);
  return REDACTED_KEY_FRAGMENTS.some((fragment) => normalizedKey.includes(fragment));
}

export function redactPreviewText(value?: string | null) {
  if (!value) {
    return value;
  }

  return value
    .replace(/\b(Authorization|Cookie|Set-Cookie)\s*[:=]\s*[^\r\n]+/gi, `$1: ${REDACTED_VALUE}`)
    .replace(AGENT_GATEWAY_TOKEN_PATTERN, REDACTED_VALUE)
    .replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, `Bearer ${REDACTED_VALUE}`)
    .replace(
      /(["']?)([A-Za-z][A-Za-z0-9_.-]*)(\1)(\s*[:=]\s*)("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[^\s,;&{}\r\n]+)/gi,
      (_match, keyQuote: string, key: string, _closingQuote: string, separator: string) =>
        shouldRedactPreviewKey(key) ? `${keyQuote}${key}${keyQuote}${separator}${REDACTED_VALUE}` : _match,
    );
}

export function redactPreviewJson(value: unknown): unknown {
  const seen = new WeakSet<object>();

  const redact = (current: unknown): unknown => {
    if (typeof current === 'string') {
      return redactPreviewText(current);
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

    const redacted: JsonRecord = {};
    for (const [key, entryValue] of Object.entries(current)) {
      redacted[key] = shouldRedactPreviewKey(key) ? REDACTED_VALUE : redact(entryValue);
    }
    return redacted;
  };

  return redact(value);
}

export function redactExternalUrlPreviewJson(value: unknown): unknown {
  const seen = new WeakSet<object>();

  const redact = (current: unknown): unknown => {
    if (typeof current === 'string') {
      return current.replace(EXTERNAL_URL_PATTERN, REDACTED_VALUE);
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

    const redacted: JsonRecord = {};
    for (const [key, entryValue] of Object.entries(current)) {
      redacted[key] = EXTERNAL_URL_KEY_FRAGMENTS.some((fragment) => normalizeKey(key).includes(fragment))
        ? REDACTED_VALUE
        : redact(entryValue);
    }
    return redacted;
  };

  return redact(value);
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  const response = getObjectRecord(getObjectRecord(error).response);
  const data = getObjectRecord(response.data);
  const errors = Array.isArray(data.errors) ? data.errors : [];
  const firstError = getObjectRecord(errors[0]);
  const message = firstError.message;
  if (typeof message === 'string' && message) {
    return message;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}

export function formatDateTime(value?: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function formatJson(value?: unknown) {
  const previewValue = redactPreviewJson(value);
  const record = getObjectRecord(previewValue);
  if (!Object.keys(record).length) {
    return '-';
  }

  return JSON.stringify(previewValue, null, 2);
}

export function statusTag(value?: string) {
  const status = value || 'unknown';
  const colorByStatus: Record<string, string> = {
    active: 'green',
    inactive: 'default',
    disabled: 'red',
    pending: 'orange',
    queued: 'blue',
    claimed: 'cyan',
    syncing_skills: 'geekblue',
    running: 'processing',
    importing: 'processing',
    finalizing: 'purple',
    canceling: 'orange',
    stalled: 'orange',
    succeeded: 'green',
    failed: 'red',
    canceled: 'default',
    timeout: 'volcano',
    abandoned: 'default',
  };

  return <Tag color={colorByStatus[status] || 'default'}>{status}</Tag>;
}

export function JsonPreview({ value }: { value?: unknown }) {
  return (
    <Typography.Text code style={{ whiteSpace: 'pre-wrap' }}>
      {formatJson(value)}
    </Typography.Text>
  );
}

export function parseJsonField(value: string | undefined, fallback: unknown) {
  const source = value?.trim();
  if (!source) {
    return fallback;
  }
  return JSON.parse(source) as unknown;
}
