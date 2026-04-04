/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {promises as fs} from 'node:fs';
import {getProfile} from './auth-store';

export interface RequestParameter {
  name: string;
  flagName: string;
  in: 'path' | 'query' | 'header' | 'cookie' | 'body';
  required?: boolean;
  type?: string;
  isArray?: boolean;
  description?: string;
  jsonEncoded?: boolean;
}

export interface RequestOperation {
  method: string;
  pathTemplate: string;
  parameters: RequestParameter[];
  hasBody?: boolean;
  bodyRequired?: boolean;
}

export interface RequestOptions {
  profile: string;
  baseUrl?: string;
  token?: string;
  flags: Record<string, any>;
  operation: RequestOperation;
}

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.replace(/\/+$/, '');
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

async function parseBody(flags: Record<string, any>, operation: RequestOperation) {
  const inlineBody = flags.body as string | undefined;
  const bodyFile = flags['body-file'] as string | undefined;
  const bodyParameters = operation.parameters.filter((parameter) => parameter.in === 'body');
  const hasBodyFlags = bodyParameters.some((parameter) => hasParameterValue(flags, parameter));

  if ((inlineBody || bodyFile) && hasBodyFlags) {
    throw new Error('Use body field flags or --body/--body-file, not both.');
  }

  if (inlineBody) {
    return JSON.parse(inlineBody);
  }

  if (bodyFile) {
    return fs.readFile(bodyFile as string, 'utf8').then((content: string) => JSON.parse(content));
  }

  if (!bodyParameters.length) {
    return undefined;
  }

  const body: Record<string, unknown> = {};

  for (const parameter of bodyParameters) {
    const rawValue = flags[parameter.flagName];
    const value = parameter.isArray && !parameter.jsonEncoded
      ? (Array.isArray(rawValue) ? rawValue : rawValue ? [rawValue] : undefined)
      : parseScalarValue(rawValue, parameter.type);

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

export async function executeApiRequest(options: RequestOptions) {
  const profile = await getProfile(options.profile);
  const baseUrl = options.baseUrl ?? profile?.baseUrl;
  const token = options.token ?? profile?.auth?.accessToken;

  if (!baseUrl) {
    throw new Error('Missing base URL. Use --base-url or configure one with `nocobase-cli auth token set`.');
  }

  const headers = new Headers();
  if (token) {
    headers.set('authorization', `Bearer ${token}`);
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

  const body = await parseBody(options.flags, options.operation);
  if (body !== undefined) {
    headers.set('content-type', 'application/json');
  }

  const url = new URL(`${normalizeBaseUrl(baseUrl)}${requestPath}`);
  query.forEach((value, key) => url.searchParams.append(key, value));

  const response = await fetch(url, {
    method: options.operation.method.toUpperCase(),
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

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
