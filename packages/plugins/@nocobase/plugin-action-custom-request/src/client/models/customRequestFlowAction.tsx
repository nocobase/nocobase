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
import {
  buildCustomRequestSendData,
  DEFAULT_CUSTOM_REQUEST_SETTINGS,
  handleCustomRequestStreamResponse,
  saveCustomRequestConfig,
} from './utils';
import { customRequestFlowActionUiSchema } from './customRequestFlowActionUiSchema';
import { CustomRequestStepParams } from './customRequestFlowActionTypes';
import { makeRequestKey, extractVariablePaths } from './utils';

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
      ...DEFAULT_CUSTOM_REQUEST_SETTINGS,
    } as CustomRequestStepParams;
  },
  beforeParamsSave: async (ctx, params: CustomRequestStepParams) => {
    const nextKey = params?.key || makeRequestKey();
    const variablePaths = extractVariablePaths(params);

    await saveCustomRequestConfig(ctx, nextKey, params);

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
    try {
      const response = await ctx.request({
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
      if (responseType === 'stream') {
        throw error;
      }

      return error;
    }
  },
});
