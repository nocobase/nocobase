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
import { NAMESPACE } from '../locale';
import { getCustomRequestConfigActionDefinition } from './common/customRequestDefinition';
import { executeCustomRequest } from './common/customRequest.shared';

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
      ...getCustomRequestConfigActionDefinition(),
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
        const requestKey = params?.key;

        if (!requestKey) {
          ctx.message.error(ctx.t('Please configure the request settings first', { ns: NAMESPACE }));
          ctx.exit();
          return;
        }

        ctx.model.setProps('loading', true);
        try {
          return await executeCustomRequest(ctx, { ...params, key: requestKey }, { throwOnError: true });
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
