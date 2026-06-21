/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionScene, defineAction, tExpr } from '@nocobase/flow-engine';
import { NAMESPACE } from './locale';
import { CustomRequestStepParams } from './customRequestFlowActionTypes';
import {
  DEFAULT_CUSTOM_REQUEST_SETTINGS,
  executeCustomRequest,
  extractVariablePaths,
  makeRequestKey,
  saveCustomRequestConfig,
} from './customRequestUtils';
import { customRequestUiSchema } from './customRequestUiSchema';

const buildSanitizedParams = (key: string, params: CustomRequestStepParams): CustomRequestStepParams => {
  return {
    key,
    configured: true,
    variablePaths: extractVariablePaths(params),
    responseType: params?.responseType || 'json',
  };
};

export const CUSTOM_REQUEST_ACTION_NAME = 'customRequest';

const isCustomRequestConfigured = (params: CustomRequestStepParams) => {
  return params?.configured === true || Array.isArray(params?.variablePaths);
};

export const customRequestFlowAction = defineAction({
  name: CUSTOM_REQUEST_ACTION_NAME,
  title: tExpr('Custom request', { ns: NAMESPACE }),
  scene: [ActionScene.DYNAMIC_EVENT_FLOW],
  sort: 1000,
  paramsRequired: true,
  uiSchema: customRequestUiSchema,
  defaultParams() {
    return {
      key: makeRequestKey(),
      ...DEFAULT_CUSTOM_REQUEST_SETTINGS,
    };
  },
  async beforeParamsSave(ctx, params: CustomRequestStepParams) {
    const key = params?.key || makeRequestKey();
    await saveCustomRequestConfig(ctx, key, params);

    const sanitizedParams = buildSanitizedParams(key, params);

    Object.keys(params || {}).forEach((fieldKey) => {
      delete (params as Record<string, unknown>)[fieldKey];
    });
    Object.assign(params as Record<string, unknown>, sanitizedParams);

    if (ctx.model.stepParams?.customRequestClickSettings) {
      ctx.model.stepParams.customRequestClickSettings = {
        ...(ctx.model.stepParams.customRequestSettings || {}),
        sendRequest: sanitizedParams,
      };
    }
  },
  handler: async (ctx, params: CustomRequestStepParams) => {
    const savedParams = ctx.model.getStepParams?.('customRequestSettings', 'requestConfig') || {};
    const runtimeParams = params?.key ? params : { ...savedParams, key: savedParams?.key };
    const requestKey = runtimeParams?.key;

    if (!requestKey || !isCustomRequestConfigured(runtimeParams)) {
      ctx.message.error(ctx.t('Please configure the request settings first', { ns: NAMESPACE }));
      ctx.exit();
      return;
    }

    try {
      const response = await executeCustomRequest(ctx, { ...runtimeParams, key: requestKey }, { throwOnError: true });
      ctx.message.success(ctx.t('Request success'));
      return response;
    } catch (error) {
      ctx.exit();
      throw error;
    }
  },
});
