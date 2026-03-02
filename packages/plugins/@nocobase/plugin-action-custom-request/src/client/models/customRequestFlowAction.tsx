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
import {
  makeRequestKey,
  normalizeNameValueArray,
  parseJsonString,
  toStepResultError,
  toStepResultSuccess,
} from './utils';

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

const getFormValues = (rawFormValues: unknown): Record<string, any> | undefined => {
  if (!rawFormValues || typeof rawFormValues !== 'object') {
    return undefined;
  }
  if ((rawFormValues as any).values && typeof (rawFormValues as any).values === 'object') {
    return (rawFormValues as any).values;
  }
  return rawFormValues as Record<string, any>;
};

const resolveFormValues = (ctx: any): Record<string, any> | undefined => {
  return getFormValues(ctx?.blockModel?.form?.getFieldsValue?.());
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

    await ctx.api.resource('customRequests').updateOrCreate({
      filterKeys: ['key'],
      values: {
        key: nextKey,
        options,
        roles: normalizeRoleNames(params?.roles),
      },
    });

    params.key = nextKey;
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

    let responseType: 'json' | 'stream' = params?.responseType || 'json';
    try {
      const currentConfig = await ctx.request({
        url: `/customRequests:get/${requestKey}`,
        method: 'GET',
      });
      const dbResponseType = currentConfig?.data?.data?.options?.responseType;
      if (dbResponseType === 'stream') {
        responseType = 'stream';
      }
    } catch (error) {
      // ignore and fallback to step params
    }

    const inputCurrentRecord = ctx.inputArgs?.currentRecord || ctx.currentRecord;
    const record = inputCurrentRecord?.data || ctx.record;
    const formValues = resolveFormValues(ctx);
    const requestRecordData =
      formValues && typeof formValues === 'object' && Object.keys(formValues as Record<string, any>).length > 0
        ? formValues
        : record;
    const dataSourceKey =
      inputCurrentRecord?.dataSourceKey || ctx.collection?.dataSourceKey || ctx.resource?.getDataSourceKey?.();
    const selectedRecord = getSelectedRecord(ctx);

    try {
      const response = await ctx.request({
        url: `/customRequests:send/${requestKey}`,
        method: 'POST',
        responseType: responseType === 'stream' ? 'blob' : 'json',
        data: {
          currentRecord: {
            // id: inputCurrentRecord?.id ?? (requestRecordData as any)?.id ?? record?.id,
            // appends: inputCurrentRecord?.appends || [],
            dataSourceKey,
            data: requestRecordData,
          },
          $nForm: formValues,
          $nSelectedRecord: selectedRecord,
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

      return toStepResultSuccess(response);
    } catch (error) {
      if (responseType === 'stream') {
        throw error;
      }

      return toStepResultError(error);
    }
  },
});
