/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionScene, defineAction, tExpr } from '@nocobase/flow-engine';
import { saveAs } from 'file-saver';
import { customRequestFlowActionUiSchema } from './customRequestFlowActionUiSchema';
import { CustomRequestStepParams } from './customRequestFlowActionTypes';
import { makeRequestKey, normalizeNameValueArray, parseJsonString } from './utils';

const VARIABLE_EXPR_REGEXP = /\{\{\s*([^{}]+?)\s*\}\}/g;

const normalizeRoleNames = (roles: unknown): string[] => {
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

const normalizeBodyData = (input: unknown) => {
  if (typeof input === 'undefined' || input === null) {
    return undefined;
  }

  if (typeof input === 'string' && input.trim() === '') {
    return undefined;
  }

  return parseJsonString(input);
};

const resolveFormValues = (ctx: any): Record<string, any> | undefined => {
  const rawFormValues = ctx?.blockModel?.form?.getFieldsValue?.();
  if (!rawFormValues || typeof rawFormValues !== 'object') {
    return undefined;
  }
  if ((rawFormValues as any).values && typeof (rawFormValues as any).values === 'object') {
    return (rawFormValues as any).values;
  }
  return rawFormValues as Record<string, any>;
};

const getSelectedRecord = (ctx: any) => {
  const fromInputArgs = ctx?.inputArgs?.$nSelectedRecord ?? ctx?.inputArgs?.selectedRows;
  if (typeof fromInputArgs !== 'undefined') {
    return fromInputArgs;
  }

  const fromResource =
    (typeof ctx?.resource?.getSelectedRows === 'function' ? ctx.resource.getSelectedRows() : undefined) ??
    ctx?.resource?.selectedRows;
  if (Array.isArray(fromResource) && fromResource.length > 0) {
    return fromResource;
  }

  return [];
};

const getDownloadFilename = (contentDisposition: string): string | undefined => {
  const utf8Match = contentDisposition.match(/filename\*=utf-8''([^;]+)/i);
  if (utf8Match) {
    return decodeURIComponent(utf8Match[1]);
  }

  const asciiMatch = contentDisposition.match(/filename="([^"]+)"/i);
  if (asciiMatch) {
    return asciiMatch[1];
  }
};

const walkAndCollectVariablePaths = (input: unknown, output: Set<string>) => {
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

const extractVariablePaths = (params: CustomRequestStepParams): string[] => {
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

const resolveVars = async (ctx: any, variablePaths?: string[]) => {
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

export const customRequestFlowAction = defineAction({
  name: 'customRequest',
  title: tExpr('Custom request'),
  scene: [ActionScene.DYNAMIC_EVENT_FLOW],
  paramsRequired: true,
  sort: 700,
  uiSchema: customRequestFlowActionUiSchema,
  defaultParams: async () => {
    return {
      key: makeRequestKey(),
      method: 'POST',
      timeout: 5000,
      responseType: 'json',
      headers: [],
      params: [],
      // roles: [],
    } as CustomRequestStepParams;
  },
  beforeParamsSave: async (ctx, params: CustomRequestStepParams) => {
    const nextKey = params?.key || makeRequestKey();
    const collectionName =
      ctx.collection?.name || ctx.collectionField?.collectionName || ctx.resource?.name || ctx.resourceName;
    const optionsDataSourceKey =
      ctx.collection?.dataSourceKey || ctx.dataSource?.key || ctx.resource?.getDataSourceKey?.();

    const options = {
      method: params?.method || 'POST',
      url: params?.url,
      headers: normalizeNameValueArray(params?.headers),
      params: normalizeNameValueArray(params?.params),
      data: normalizeBodyData(params?.data),
      timeout: params?.timeout,
      responseType: params?.responseType || 'json',
      ...(collectionName ? { collectionName } : {}),
      ...(optionsDataSourceKey ? { dataSourceKey: optionsDataSourceKey } : {}),
    };
    const variablePaths = extractVariablePaths(params);

    await ctx.api.resource('customRequests').updateOrCreate({
      filterKeys: ['key'],
      values: {
        key: nextKey,
        options,
        roles: normalizeRoleNames(params?.roles),
      },
    });

    Object.keys(params || {}).forEach((fieldKey) => {
      if (!['key', 'variablePaths', 'responseType'].includes(fieldKey)) {
        delete (params as Record<string, any>)[fieldKey];
      }
    });

    params.key = nextKey;
    params.variablePaths = variablePaths;
    params.responseType = params?.responseType || 'json';
  },
  handler: async (ctx, params: CustomRequestStepParams) => {
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
    const responseType: 'json' | 'stream' = params?.responseType || 'json';
    const vars = await resolveVars(ctx, params?.variablePaths);
    try {
      const response = await ctx.request({
        url: `/customRequests:send/${requestKey}`,
        method: 'POST',
        responseType: responseType === 'stream' ? 'blob' : 'json',
        data: {
          vars,
        },
      });

      if (responseType === 'stream') {
        const contentDisposition =
          response?.headers?.['content-disposition'] || response?.headers?.['Content-Disposition'];
        if (contentDisposition) {
          const filename = getDownloadFilename(contentDisposition);
          if (filename) {
            saveAs(response.data, filename);
          }
        }
        return;
      }

      return response;
    } catch (error) {
      if (responseType === 'stream') {
        throw error;
      }

      return error;
    }
  },
});
