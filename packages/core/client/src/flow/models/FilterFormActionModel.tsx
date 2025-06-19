/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, FlowModel, MultiRecordResource } from '@nocobase/flow-engine';
import { Button } from 'antd';
import type { ButtonType } from 'antd/es/button';
import React from 'react';
import { ActionModel } from './ActionModel';
import { BlockFlowModel } from './BlockFlowModel';

export class FilterFormActionModel extends ActionModel {}

export class FilterFormSubmitActionModel extends FilterFormActionModel {
  title = 'Filter';
  type: ButtonType = 'primary';
}

FilterFormSubmitActionModel.registerFlow({
  key: 'event1',
  on: {
    eventName: 'click',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        if (!ctx.shared?.currentBlockModel?.form) {
          ctx.globals.message.error('No form available for submission.');
          return;
        }
        const currentBlockModel = ctx.shared.currentBlockModel;
        await currentBlockModel.form.submit();
        const values = currentBlockModel.form.values;
        const flowEngine = ctx.globals.flowEngine as FlowEngine;
        flowEngine.forEachModel((model: BlockFlowModel) => {
          if (model.resource && model?.collection?.name === currentBlockModel.collection.name) {
            (model.resource as MultiRecordResource).addFilterGroup(currentBlockModel.uid, values);
            (model.resource as MultiRecordResource).refresh();
          }
        });
      },
    },
  },
});

export class FilterFormResetActionModel extends FilterFormActionModel {
  title = 'Reset';
}

FilterFormResetActionModel.registerFlow({
  key: 'event1',
  on: {
    eventName: 'click',
  },
  steps: {
    step1: {
      async handler(ctx, params) {
        if (!ctx.shared?.currentBlockModel?.form) {
          ctx.globals.message.error('No form available for reset.');
          return;
        }
        const currentBlockModel = ctx.shared.currentBlockModel;
        await currentBlockModel.form.reset();
        const flowEngine = ctx.globals.flowEngine as FlowEngine;
        flowEngine.forEachModel((model: BlockFlowModel) => {
          if (model.resource && model?.collection?.name === currentBlockModel.collection.name) {
            (model.resource as MultiRecordResource).removeFilterGroup(currentBlockModel.uid);
            (model.resource as MultiRecordResource).refresh();
          }
        });
      },
    },
  },
});
