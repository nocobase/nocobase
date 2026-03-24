/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CustomRequestStepParams } from '../customRequestFlowActionTypes';
import {
  DEFAULT_CUSTOM_REQUEST_SETTINGS,
  extractVariablePaths,
  makeRequestKey,
  saveCustomRequestConfig,
} from './customRequest.shared';
import { customRequestFlowActionUiSchema } from './customRequestFlowActionUiSchema';

const saveCurrentStepRequestParams = (ctx: any, params: CustomRequestStepParams) => {
  const flowKey = ctx?.flowKey;
  const stepKey = ctx?.currentStep?.key;

  if (flowKey && stepKey && typeof ctx?.model?.setStepParams === 'function') {
    ctx.model.setStepParams(flowKey, stepKey, params);
    return;
  }

  if (flowKey && stepKey && ctx?.model?.stepParams) {
    ctx.model.stepParams[flowKey] = {
      ...(ctx.model.stepParams[flowKey] || {}),
      [stepKey]: params,
    };
  }
};

const getCurrentStepRequestKey = (ctx: any, params?: CustomRequestStepParams) => {
  return params?.key || ctx?.model?.getStepParams?.(ctx?.flowKey, ctx?.currentStep?.key)?.key;
};

const buildSanitizedParams = (key: string, params: CustomRequestStepParams): CustomRequestStepParams => {
  return {
    key,
    variablePaths: extractVariablePaths(params),
    responseType: params?.responseType || 'json',
  };
};

export const getCustomRequestConfigActionDefinition = () => ({
  paramsRequired: true,
  uiSchema: customRequestFlowActionUiSchema,
  defaultParams(ctx: any) {
    const key = getCurrentStepRequestKey(ctx) || makeRequestKey();
    return {
      key,
      ...DEFAULT_CUSTOM_REQUEST_SETTINGS,
    };
  },
  async beforeParamsSave(ctx: any, params: CustomRequestStepParams) {
    const key = getCurrentStepRequestKey(ctx, params) || makeRequestKey();

    await saveCustomRequestConfig(ctx, key, params);

    const sanitizedParams = buildSanitizedParams(key, params);

    Object.keys(params || {}).forEach((fieldKey) => {
      delete (params as Record<string, any>)[fieldKey];
    });
    Object.assign(params as Record<string, any>, sanitizedParams);

    saveCurrentStepRequestParams(ctx, sanitizedParams);
  },
});
