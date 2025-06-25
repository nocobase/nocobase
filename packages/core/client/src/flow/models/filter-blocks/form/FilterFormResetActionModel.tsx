/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, MultiRecordResource } from '@nocobase/flow-engine';
import { ButtonProps } from 'antd';
import { DataBlockModel } from '../../base/BlockModel';
import { FilterFormActionModel } from './FilterFormActionModel';

export class FilterFormResetActionModel extends FilterFormActionModel {
  defaultProps: ButtonProps = {
    children: 'Reset',
  };
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
        flowEngine.forEachModel((model: DataBlockModel) => {
          if (model.resource && model?.collection?.name === currentBlockModel.collection.name) {
            (model.resource as MultiRecordResource).removeFilterGroup(currentBlockModel.uid);
            (model.resource as MultiRecordResource).refresh();
          }
        });
      },
    },
  },
});
