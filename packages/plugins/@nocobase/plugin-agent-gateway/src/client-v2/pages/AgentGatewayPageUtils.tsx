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
import {
  AGENT_GATEWAY_API_ACTIONS,
  AgentGatewayActionQuery,
  AgentGatewayActionRequest,
  AgentGatewayActionResponse,
  AgentGatewayApiAction,
  getAgentGatewayApiUrl,
  parseAgentGatewayActionQuery,
  parseAgentGatewayActionRequest,
  parseAgentGatewayActionResponse,
} from '../../shared/apiContract';

export interface AgentGatewayApiResponse<T, TMeta = Record<string, unknown>> {
  data?: {
    data?: T;
    meta?: TMeta;
  };
}

export interface AgentGatewayApi {
  request<T, TMeta = Record<string, unknown>>(config: {
    url: string;
    method: 'get' | 'post';
    data?: object;
    params?: object;
  }): Promise<AgentGatewayApiResponse<T, TMeta>>;
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

export async function requestAgentGatewayAction<
  Response = never,
  TMeta = Record<string, unknown>,
  Action extends AgentGatewayApiAction = AgentGatewayApiAction,
>(
  api: AgentGatewayApi,
  action: Action,
  config: {
    method: 'get' | 'post';
    targetKey?: string | number;
    data?: AgentGatewayActionRequest<Action>;
    params?: AgentGatewayActionQuery<Action>;
  },
): Promise<AgentGatewayApiResponse<[Response] extends [never] ? AgentGatewayActionResponse<Action> : Response, TMeta>> {
  const requestData = parseAgentGatewayActionRequest(action, config.data || {});
  const query = parseAgentGatewayActionQuery(action, config.params || {});
  const response = await api.request<unknown, TMeta>({
    url: getAgentGatewayApiUrl(action, config.targetKey),
    method: config.method,
    ...(config.method === 'post' || config.data ? { data: requestData } : {}),
    ...(config.params ? { params: query } : {}),
  });
  const responseData = response.data?.data;
  const parsedData = parseAgentGatewayActionResponse(action, responseData === undefined ? {} : responseData);
  return {
    ...response,
    data: {
      ...response.data,
      data: parsedData as [Response] extends [never] ? AgentGatewayActionResponse<Action> : Response,
    },
  };
}

export type JsonRecord = Record<string, unknown>;

const FILE_UPLOAD_CHUNK_BYTES = 1024 * 1024;

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 32 * 1024) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 32 * 1024, bytes.length)));
  }
  return btoa(binary);
}

async function readBlobAsArrayBuffer(blob: Blob) {
  if (typeof blob.arrayBuffer === 'function') {
    return await blob.arrayBuffer();
  }
  return await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error || new Error('Failed to read upload chunk'));
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
        return;
      }
      reject(new Error('Failed to read upload chunk'));
    };
    reader.readAsArrayBuffer(blob);
  });
}

export async function uploadAgentGatewayFile(
  api: AgentGatewayApi,
  file: File,
  purpose: 'skill-version' | 'run-artifact',
) {
  const initResponse = await requestAgentGatewayAction<{ id: string; chunkSize?: number }>(
    api,
    AGENT_GATEWAY_API_ACTIONS.initFileUpload,
    {
      method: 'post',
      data: {
        purpose,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
      },
    },
  );
  const initialized = getRequiredResponseData(initResponse, 'Failed to initialize file upload');
  const chunkSize = initialized.chunkSize || FILE_UPLOAD_CHUNK_BYTES;
  try {
    for (let offset = 0; offset < file.size; offset += chunkSize) {
      const chunk = await readBlobAsArrayBuffer(file.slice(offset, Math.min(offset + chunkSize, file.size)));
      await requestAgentGatewayAction(api, AGENT_GATEWAY_API_ACTIONS.appendFileUpload, {
        method: 'post',
        targetKey: initialized.id,
        data: {
          offset,
          contentBase64: arrayBufferToBase64(chunk),
        },
      });
    }
    await requestAgentGatewayAction(api, AGENT_GATEWAY_API_ACTIONS.completeFileUpload, {
      method: 'post',
      targetKey: initialized.id,
    });
    return initialized.id;
  } catch (error) {
    await requestAgentGatewayAction(api, AGENT_GATEWAY_API_ACTIONS.abortFileUpload, {
      method: 'post',
      targetKey: initialized.id,
    }).catch(() => undefined);
    throw error;
  }
}

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

export function getResponseData<T, TMeta>(response: AgentGatewayApiResponse<T, TMeta>, fallback: T) {
  return response.data?.data ?? fallback;
}

export function getRequiredResponseData<T, TMeta>(response: AgentGatewayApiResponse<T, TMeta>, message: string) {
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
