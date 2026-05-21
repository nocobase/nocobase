/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createWriteStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import { basename, dirname } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { AuthStoreOptions } from './auth-store.js';
import { resolveServerRequestTarget } from './env-auth.js';
import { fetchWithPreservedAuthRedirect } from './http-request.js';

const CLI_REQUEST_SOURCE_HEADER = 'x-request-source';
const CLI_REQUEST_SOURCE_VALUE = 'cli';

export interface RequestParameter {
  name: string;
  flagName: string;
  in: 'path' | 'query' | 'header' | 'cookie' | 'body';
  required?: boolean;
  type?: string;
  isArray?: boolean;
  description?: string;
  jsonEncoded?: boolean;
  isFile?: boolean;
}

export interface RequestOperation {
  method: string;
  pathTemplate: string;
  parameters: RequestParameter[];
  hasBody?: boolean;
  bodyRequired?: boolean;
  requestContentType?: 'application/json' | 'multipart/form-data';
  responseType?: 'json' | 'binary';
}

export interface RequestOptions {
  envName?: string;
  baseUrl?: string;
  token?: string;
  role?: string;
  scope?: AuthStoreOptions['scope'];
  flags: Record<string, any>;
  operation: RequestOperation;
}

export interface RawRequestOptions {
  envName?: string;
  baseUrl?: string;
  token?: string;
  role?: string;
  scope?: AuthStoreOptions['scope'];
  timeoutMs?: number;
  method: string;
  path: string;
  query?: Record<string, any>;
  headers?: Record<string, any>;
  body?: unknown;
}

function stripUtf8Bom(text: string) {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function parseJsonInput(raw: string, flagName: string) {
  const content = stripUtf8Bom(raw);
  try {
    return JSON.parse(content);
  } catch (error: any) {
    throw new Error(`Invalid JSON for --${flagName}: ${error?.message ?? 'parse failed'}`);
  }
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
}

async function parseResponse(response: Response) {
  const text = await response.text();
  let data: unknown = text;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch (error) {
      data = text;
    }
  }

  return {
    ok: response.ok,
    status: response.status,
    data,
  };
}

async function parseBinaryResponse(response: Response, outputPath: string) {
  if (response.ok && response.body) {
    await fs.mkdir(dirname(outputPath), { recursive: true }).catch(() => undefined);
    await pipeline(Readable.fromWeb(response.body as any), createWriteStream(outputPath));
    return {
      ok: response.ok,
      status: response.status,
      data: {
        output: outputPath,
      },
    };
  }

  return parseResponse(response);
}

function parseScalarValue(value: any, type?: string) {
  if (value === undefined) {
    return undefined;
  }

  if (type === 'boolean') {
    return value;
  }

  if (type === 'integer' || type === 'number') {
    return Number(value);
  }

  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    try {
      return JSON.parse(trimmed);
    } catch (error) {
      return value;
    }
  }

  return value;
}

function hasParameterValue(flags: Record<string, any>, parameter: RequestParameter) {
  const value = flags[parameter.flagName];
  if (parameter.type === 'boolean') {
    return value !== undefined;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return value !== undefined && value !== '';
}

function listProvidedBodyFlags(flags: Record<string, any>, parameters: RequestParameter[]) {
  return parameters
    .filter((parameter) => hasParameterValue(flags, parameter))
    .map((parameter) => `--${parameter.flagName}`);
}

function parseBodyFieldValue(rawValue: any, parameter: RequestParameter) {
  if (rawValue === undefined) {
    return undefined;
  }

  if (parameter.isArray && !parameter.jsonEncoded) {
    return Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : undefined;
  }

  if (parameter.jsonEncoded || parameter.type === 'object' || parameter.type === 'array') {
    if (typeof rawValue !== 'string') {
      return rawValue;
    }

    const parsed = parseJsonInput(rawValue, parameter.flagName);
    if (parameter.type === 'array' && !Array.isArray(parsed)) {
      throw new Error(`--${parameter.flagName} must be a JSON array`);
    }
    if (parameter.type === 'object' && (parsed === null || Array.isArray(parsed) || typeof parsed !== 'object')) {
      throw new Error(`--${parameter.flagName} must be a JSON object`);
    }

    return parsed;
  }

  return parseScalarValue(rawValue, parameter.type);
}

export async function parseBody(flags: Record<string, any>, operation: RequestOperation) {
  if (operation.requestContentType === 'multipart/form-data') {
    return undefined;
  }

  const inlineBody = flags.body as string | undefined;
  const bodyFile = flags['body-file'] as string | undefined;
  const bodyParameters = operation.parameters.filter((parameter) => parameter.in === 'body');
  const hasBodyFlags = bodyParameters.some((parameter) => hasParameterValue(flags, parameter));

  if ((inlineBody || bodyFile) && hasBodyFlags) {
    const providedBodyFlags = listProvidedBodyFlags(flags, bodyParameters);
    const rawBodyInput = inlineBody ? '--body' : '--body-file';
    throw new Error(
      `Conflicting request body inputs: received ${rawBodyInput} together with body field flags (${providedBodyFlags.join(', ')}). Use either body field flags or --body/--body-file.`,
    );
  }

  if (inlineBody) {
    return parseJsonInput(inlineBody, 'body');
  }

  if (bodyFile) {
    return fs.readFile(bodyFile as string, 'utf8').then((content: string) => parseJsonInput(content, 'body-file'));
  }

  if (!bodyParameters.length) {
    return undefined;
  }

  const body: Record<string, unknown> = {};

  for (const parameter of bodyParameters) {
    const rawValue = flags[parameter.flagName];
    const value = parseBodyFieldValue(rawValue, parameter);

    if (parameter.required && (value === undefined || value === '')) {
      throw new Error(`Missing required body field --${parameter.flagName}`);
    }

    if (value === undefined) {
      continue;
    }

    body[parameter.name] = value;
  }

  if (Object.keys(body).length > 0) {
    return body;
  }

  if (operation.hasBody && operation.bodyRequired) {
    throw new Error('Missing request body. Use body field flags or --body/--body-file.');
  }

  return undefined;
}

async function createMultipartBody(flags: Record<string, any>, operation: RequestOperation) {
  const bodyParameters = operation.parameters.filter((parameter) => parameter.in === 'body');
  const formData = new FormData();
  let hasValues = false;

  for (const parameter of bodyParameters) {
    const rawValue = flags[parameter.flagName];
    const hasValue = hasParameterValue(flags, parameter);

    if (parameter.required && !hasValue) {
      throw new Error(`Missing required body field --${parameter.flagName}`);
    }

    if (!hasValue) {
      continue;
    }

    if (parameter.isFile) {
      const filePath = String(rawValue);
      const content = await fs.readFile(filePath);
      const arrayBuffer = content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength) as ArrayBuffer;
      formData.append(parameter.name, new Blob([arrayBuffer]), basename(filePath));
      hasValues = true;
      continue;
    }

    const value = parseBodyFieldValue(rawValue, parameter);
    if (value === undefined) {
      continue;
    }

    formData.append(parameter.name, typeof value === 'object' ? JSON.stringify(value) : String(value));
    hasValues = true;
  }

  if (!hasValues && operation.bodyRequired) {
    throw new Error('Missing multipart request body.');
  }

  return hasValues ? formData : undefined;
}

export async function executeApiRequest(options: RequestOptions) {
  const { baseUrl, token } = await resolveServerRequestTarget(options);

  const headers = new Headers();
  headers.set(CLI_REQUEST_SOURCE_HEADER, CLI_REQUEST_SOURCE_VALUE);
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }
  if (options.role) {
    headers.set('x-role', options.role);
  }

  const query = new URLSearchParams();
  let requestPath = options.operation.pathTemplate;

  for (const parameter of options.operation.parameters) {
    if (parameter.in === 'body') {
      continue;
    }

    const rawValue = options.flags[parameter.flagName];
    const value = parameter.isArray
      ? (Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : undefined)
      : parseScalarValue(rawValue, parameter.type);

    if (parameter.required && (value === undefined || value === '')) {
      throw new Error(`Missing required parameter --${parameter.flagName}`);
    }

    if (value === undefined) {
      continue;
    }

    if (parameter.in === 'path') {
      requestPath = requestPath.replace(`{${parameter.name}}`, encodeURIComponent(String(value)));
      continue;
    }

    if (parameter.in === 'query') {
      if (Array.isArray(value)) {
        value.forEach((item) => query.append(parameter.name, String(parseScalarValue(item, parameter.type))));
      } else if (typeof value === 'object') {
        query.set(parameter.name, JSON.stringify(value));
      } else {
        query.set(parameter.name, String(value));
      }
      continue;
    }

    if (parameter.in === 'header') {
      headers.set(parameter.name, typeof value === 'object' ? JSON.stringify(value) : String(value));
      continue;
    }
  }

  const body =
    options.operation.requestContentType === 'multipart/form-data'
      ? await createMultipartBody(options.flags, options.operation)
      : await parseBody(options.flags, options.operation);
  if (body !== undefined && options.operation.requestContentType !== 'multipart/form-data') {
    headers.set('content-type', 'application/json');
  }

  const url = new URL(`${normalizeBaseUrl(baseUrl)}${requestPath}`);
  query.forEach((value, key) => url.searchParams.append(key, value));

  const response = await fetchWithPreservedAuthRedirect(url.toString(), {
    method: options.operation.method.toUpperCase(),
    headers,
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
  });

  if (options.operation.responseType === 'binary') {
    const outputPath = options.flags.output;
    if (!outputPath) {
      throw new Error('Missing required output path --output');
    }
    return parseBinaryResponse(response, outputPath);
  }

  return parseResponse(response);
}

export async function executeRawApiRequest(options: RawRequestOptions) {
  const { baseUrl, token } = await resolveServerRequestTarget(options);

  const headers = new Headers();
  headers.set(CLI_REQUEST_SOURCE_HEADER, CLI_REQUEST_SOURCE_VALUE);
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
  }
  if (options.role) {
    headers.set('x-role', options.role);
  }

  for (const [name, value] of Object.entries(options.headers ?? {})) {
    if (value === undefined || value === null || value === '') {
      continue;
    }

    headers.set(name, typeof value === 'object' ? JSON.stringify(value) : String(value));
  }

  if (options.body !== undefined) {
    headers.set('content-type', 'application/json');
  }

  const url = new URL(`${normalizeBaseUrl(baseUrl)}${options.path}`);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, typeof item === 'object' ? JSON.stringify(item) : String(item));
      }
      continue;
    }

    url.searchParams.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
  }

  const controller = options.timeoutMs && options.timeoutMs > 0 ? new AbortController() : undefined;
  const timeout = controller
    ? setTimeout(() => {
        controller.abort();
      }, options.timeoutMs)
    : undefined;

  try {
    const response = await fetchWithPreservedAuthRedirect(url.toString(), {
      method: options.method.toUpperCase(),
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller?.signal,
    });

    return parseResponse(response);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
