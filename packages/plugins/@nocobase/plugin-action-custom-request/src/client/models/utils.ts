/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@nocobase/utils/client';
import { saveAs } from 'file-saver';

type RequestNameValue = {
  name: string;
  value: unknown;
};

export type CustomRequestRecord = {
  options?: Record<string, any>;
  roles?: unknown[];
};

export type CustomRequestConfigParams = {
  key?: string;
  method?: string;
  url?: string;
  headers?: Array<{ name?: string; value?: string }>;
  params?: Array<{ name?: string; value?: string }>;
  data?: unknown;
  timeout?: number;
  responseType?: 'json' | 'stream';
  variablePaths?: string[];
  roles?: string[];
};

export type ExecuteCustomRequestOptions = {
  throwOnError?: boolean;
};

export function makeRequestKey() {
  return `req-${uid()}`;
}

export function normalizeNameValueArray(arr: any): RequestNameValue[] {
  if (!Array.isArray(arr)) {
    return [];
  }
  return arr
    .map((item) => ({
      name: String(item?.name || '').trim(),
      value: typeof item?.value === 'undefined' || item?.value === null ? '' : item.value,
    }))
    .filter((item) => !!item.name);
}

export const DEFAULT_CUSTOM_REQUEST_SETTINGS: CustomRequestConfigParams = {
  method: 'POST',
  timeout: 5000,
  responseType: 'json',
  headers: [],
  params: [],
};

export const normalizeRoleNames = (roles: unknown): string[] => {
  if (!Array.isArray(roles)) {
    return [];
  }

  return roles
    .map((item: any) => {
      if (typeof item === 'string') {
        return item;
      }
      if (item && typeof item === 'object') {
        return item.name || item.value || item.roleName;
      }
      return undefined;
    })
    .map((name) => (typeof name === 'string' ? name.trim() : ''))
    .filter(Boolean);
};

export const normalizeBodyData = (input: unknown) => {
  if (typeof input === 'undefined' || input === null) {
    return undefined;
  }

  if (typeof input === 'string' && input.trim() === '') {
    return undefined;
  }

  if (typeof input !== 'string') {
    return input;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return undefined;
  }

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    return input;
  }
};

export const toCustomRequestConfigurationInitialValues = (record?: CustomRequestRecord) => {
  const values = { ...(record?.options || {}) };

  if (typeof values.data !== 'undefined' && values.data !== null && typeof values.data !== 'string') {
    values.data = JSON.stringify(values.data, null, 2);
  }

  values.roles = normalizeRoleNames(record?.roles);

  return values;
};

export const loadCustomRequestRecord = async (ctx: any, key?: string): Promise<CustomRequestRecord | undefined> => {
  if (!key) {
    return undefined;
  }

  const request = getRequestExecutor(ctx);
  if (typeof request !== 'function') {
    return undefined;
  }

  try {
    const response = await request({
      url: `/customRequests:get/${key}`,
      method: 'GET',
      params: {
        appends: ['roles'],
      },
    });

    return response?.data?.data;
  } catch (error) {
    return undefined;
  }
};

export const getDownloadFilename = (contentDisposition: string): string | undefined => {
  const utf8Match = contentDisposition.match(/filename\*=utf-8''([^;]+)/i);
  if (utf8Match) {
    return decodeURIComponent(utf8Match[1]);
  }

  const asciiMatch = contentDisposition.match(/filename="([^"]+)"/i);
  if (asciiMatch) {
    return asciiMatch[1];
  }
};

export const buildCustomRequestOptions = (ctx: any, params: CustomRequestConfigParams) => {
  return {
    method: params?.method || 'POST',
    url: params?.url,
    headers: normalizeNameValueArray(params?.headers),
    params: normalizeNameValueArray(params?.params),
    data: normalizeBodyData(params?.data),
    timeout: params?.timeout,
    responseType: params?.responseType || 'json',
  };
};

export const saveCustomRequestConfig = async (ctx: any, key: string, params: CustomRequestConfigParams) => {
  await ctx.api.resource('customRequests').updateOrCreate({
    filterKeys: ['key'],
    values: {
      key,
      options: buildCustomRequestOptions(ctx, { ...params, key }),
      roles: normalizeRoleNames(params?.roles),
    },
  });
};

export const handleCustomRequestStreamResponse = (response: any) => {
  const contentDisposition = response?.headers?.['content-disposition'] || response?.headers?.['Content-Disposition'];
  if (!contentDisposition) {
    return;
  }

  const filename = getDownloadFilename(contentDisposition);
  if (filename) {
    return {
      filename,
      data: response.data,
    };
  }
};

const VARIABLE_EXPR_REGEXP = /\{\{\s*([^{}]+?)\s*\}\}/g;

export const walkAndCollectVariablePaths = (input: unknown, output: Set<string>) => {
  if (typeof input === 'string') {
    const matches = input.matchAll(VARIABLE_EXPR_REGEXP);
    for (const matched of matches) {
      const expr = matched?.[1]?.trim();
      if (!expr || !expr.startsWith('ctx.')) {
        continue;
      }
      output.add(expr);
    }
    return;
  }

  if (Array.isArray(input)) {
    input.forEach((item) => walkAndCollectVariablePaths(item, output));
    return;
  }

  if (input && typeof input === 'object') {
    Object.values(input as Record<string, unknown>).forEach((value) => walkAndCollectVariablePaths(value, output));
  }
};

export const extractVariablePaths = (params: any): string[] => {
  const sources = [params?.url, params?.headers, params?.params, params?.data];

  const variablePaths = new Set<string>();
  sources.forEach((source) => walkAndCollectVariablePaths(source, variablePaths));
  return Array.from(variablePaths);
};

const buildVarsTemplate = (variablePaths: string[]) => {
  return variablePaths.reduce(
    (acc, path) => {
      acc[path] = `{{${path}}}`;
      return acc;
    },
    {} as Record<string, string>,
  );
};

export const resolveCustomRequestVars = async (ctx: any, variablePaths?: string[]) => {
  if (!Array.isArray(variablePaths) || !variablePaths.length || typeof ctx?.resolveJsonTemplate !== 'function') {
    return undefined;
  }

  try {
    const template = buildVarsTemplate(variablePaths);
    const resolved = await ctx.resolveJsonTemplate(template);
    if (!resolved || typeof resolved !== 'object') {
      return undefined;
    }

    return variablePaths.reduce(
      (acc, path) => {
        const value = (resolved as Record<string, unknown>)[path];
        if (typeof value === 'undefined') {
          return acc;
        }
        if (typeof value === 'string' && value.trim() === `{{${path}}}`) {
          return acc;
        }
        acc[path] = value;
        return acc;
      },
      {} as Record<string, unknown>,
    );
  } catch (error) {
    return undefined;
  }
};

export const buildCustomRequestSendData = async (ctx: any, variablePaths?: string[]) => {
  return {
    vars: await resolveCustomRequestVars(ctx, variablePaths),
  };
};

function getRequestExecutor(ctx: any) {
  if (typeof ctx?.request === 'function') {
    return ctx.request.bind(ctx);
  }

  if (typeof ctx?.api?.request === 'function') {
    return ctx.api.request.bind(ctx.api);
  }

  if (typeof ctx?.model?.context?.api?.request === 'function') {
    return ctx.model.context.api.request.bind(ctx.model.context.api);
  }

  return undefined;
}

export const executeCustomRequest = async (
  ctx: any,
  params?: CustomRequestConfigParams,
  options?: ExecuteCustomRequestOptions,
) => {
  const requestKey = params?.key;
  if (!requestKey) {
    return {
      ok: false,
      status: 400,
      error: {
        message: 'custom request key is required',
      },
    };
  }

  const request = getRequestExecutor(ctx);
  if (typeof request !== 'function') {
    throw new Error('custom request executor is not available');
  }

  const responseType: 'json' | 'stream' = params?.responseType || 'json';

  try {
    const response = await request({
      url: `/customRequests:send/${requestKey}`,
      method: 'POST',
      responseType: responseType === 'stream' ? 'blob' : 'json',
      data: await buildCustomRequestSendData(ctx, params?.variablePaths),
    });

    if (responseType === 'stream') {
      const streamFile = handleCustomRequestStreamResponse(response);
      if (streamFile) {
        saveAs(streamFile.data, streamFile.filename);
      }
      return;
    }

    return response;
  } catch (error) {
    if (responseType === 'stream' || options?.throwOnError) {
      throw error;
    }

    return error;
  }
};
