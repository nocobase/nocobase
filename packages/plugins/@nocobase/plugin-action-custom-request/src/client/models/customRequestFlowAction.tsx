/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ActionScene, defineAction, tExpr } from '@nocobase/flow-engine';
import { NAMESPACE } from '../locale';
import { executeCustomRequest } from './utils';
import { CustomRequestStepParams } from './customRequestFlowActionTypes';
import {
  DEFAULT_CUSTOM_REQUEST_SETTINGS,
  extractVariablePaths,
  makeRequestKey,
  saveCustomRequestConfig,
} from './utils';
import { customRequestUiSchema } from './customRequestUiSchema';

const buildSanitizedParams = (key: string, params: CustomRequestStepParams): CustomRequestStepParams => {
  return {
    key,
    variablePaths: extractVariablePaths(params),
    responseType: params?.responseType || 'json',
  };
};

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

export const CUSTOM_REQUEST_ACTION_NAME = 'customRequest';

export const customRequestFlowAction = defineAction({
  name: CUSTOM_REQUEST_ACTION_NAME,
  title: tExpr('Custom request', { ns: NAMESPACE }),
  scene: [ActionScene.DYNAMIC_EVENT_FLOW],
  sort: 1000,
  paramsRequired: true,
  uiSchema: customRequestUiSchema,
  defaultParams(ctx: any) {
    const key = ctx?.model?.getStepParams?.(ctx?.flowKey, ctx?.currentStep?.key)?.key || makeRequestKey();
    return {
      key,
      ...DEFAULT_CUSTOM_REQUEST_SETTINGS,
    };
  },
  async beforeParamsSave(ctx: any, params: CustomRequestStepParams) {
    const key =
      params?.key || ctx?.model?.getStepParams?.(ctx?.flowKey, ctx?.currentStep?.key)?.key || makeRequestKey();

    await saveCustomRequestConfig(ctx, key, params);

    const sanitizedParams = buildSanitizedParams(key, params);

    Object.keys(params || {}).forEach((fieldKey) => {
      delete (params as Record<string, any>)[fieldKey];
    });
    Object.assign(params as Record<string, any>, sanitizedParams);

    saveCurrentStepRequestParams(ctx, sanitizedParams);
  },
  handler: async (ctx, params: CustomRequestStepParams) => {
    const savedParams = ctx.model.getStepParams?.('customRequestSettings', 'requestConfig') || {};
    const runtimeParams = params?.key ? params : { ...savedParams, key: savedParams?.key };
    const requestKey = runtimeParams?.key;

    if (!requestKey) {
      ctx.message.error(ctx.t('Please configure the request settings first', { ns: NAMESPACE }));
      ctx.exit();
      return;
    }

    try {
      return await executeCustomRequest(ctx, { ...runtimeParams, key: requestKey }, { throwOnError: true });
    } catch (error) {
      ctx.exit();
      throw error;
    }
  },
});
