/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionSceneEnum,
  CollectionActionGroupModel,
  FormActionGroupModel,
  RecordActionGroupModel,
  ActionModel,
  PopupSubTableFormActionGroupModel,
} from '@nocobase/client';
import { tExpr } from '@nocobase/flow-engine';
import type { ButtonProps } from 'antd/es/button';
import { saveAs } from 'file-saver';
import { NAMESPACE } from '../locale';
import {
  buildCustomRequestSendData,
  DEFAULT_CUSTOM_REQUEST_SETTINGS,
  makeRequestKey,
  handleCustomRequestStreamResponse,
  saveCustomRequestConfig,
  extractVariablePaths,
} from './utils';
import { customRequestFlowActionUiSchema } from './customRequestFlowActionUiSchema';
import type { CustomRequestConfigParams } from './utils';

const getRequestKey = (model: any, params?: CustomRequestConfigParams) => {
  return params?.key || model?.getStepParams?.('customRequestSettings', 'requestConfig')?.key;
};

export class CustomRequestActionModel extends ActionModel {
  static scene = ActionSceneEnum.all;
  defaultProps: ButtonProps = {
    title: tExpr('Custom request', { ns: NAMESPACE }),
  };
}

CustomRequestActionModel.define({
  label: tExpr('Custom request', { ns: NAMESPACE }),
  sort: 9999,
  createModelOptions: {
    use: 'CustomRequestActionModel',
  },
});

CustomRequestActionModel.registerFlow({
  key: 'customRequestSettings',
  manual: true,
  title: tExpr('Request settings', { ns: NAMESPACE }),
  steps: {
    requestConfig: {
      title: tExpr('Request settings', { ns: NAMESPACE }),
      uiSchema: customRequestFlowActionUiSchema,
      defaultParams(ctx) {
        const key = getRequestKey(ctx.model) || makeRequestKey();
        return {
          key,
          ...DEFAULT_CUSTOM_REQUEST_SETTINGS,
        };
      },
      async beforeParamsSave(ctx, params) {
        const key = getRequestKey(ctx.model, params) || makeRequestKey();
        const variablePaths = extractVariablePaths(params);

        await saveCustomRequestConfig(ctx, key, params);

        const sanitizedParams = {
          key,
          variablePaths,
          responseType: params?.responseType || 'json',
        };

        Object.keys(params || {}).forEach((fieldKey) => {
          delete (params as Record<string, any>)[fieldKey];
        });
        Object.assign(params as Record<string, any>, sanitizedParams);

        ctx.model.stepParams.customRequestSettings = {
          ...(ctx.model.stepParams.customRequestSettings || {}),
          requestConfig: sanitizedParams,
        };
      },
      handler() {},
    },
  },
});

CustomRequestActionModel.registerFlow({
  key: 'customRequestClickSettings',
  on: 'click',
  title: tExpr('Click settings', { ns: NAMESPACE }),
  steps: {
    confirm: {
      use: 'confirm',
      defaultParams: {
        enable: false,
        title: tExpr('Please confirm custom request', { ns: NAMESPACE }),
        content: tExpr('Are you sure you want to send this custom request?', { ns: NAMESPACE }),
      },
    },
    sendRequest: {
      async handler(ctx) {
        const params = ctx.model.getStepParams?.('customRequestSettings', 'requestConfig') || {};
        const requestKey = getRequestKey(ctx.model, params);
        const responseType: 'json' | 'stream' = params?.responseType || 'json';

        if (!requestKey) {
          ctx.message.error(ctx.t('Please configure the request settings first', { ns: NAMESPACE }));
          ctx.exit();
          return;
        }

        ctx.model.setProps('loading', true);
        try {
          const response = await ctx.api.request({
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
          }
        } catch (error) {
          ctx.exit();
          throw error;
        } finally {
          ctx.model.setProps('loading', false);
        }
      },
    },
  },
});

CollectionActionGroupModel.registerActionModels({
  CustomRequestActionModel,
});

RecordActionGroupModel.registerActionModels({
  CustomRequestActionModel,
});

FormActionGroupModel.registerActionModels({
  CustomRequestActionModel,
});

PopupSubTableFormActionGroupModel.registerActionModels({
  CustomRequestActionModel,
});
