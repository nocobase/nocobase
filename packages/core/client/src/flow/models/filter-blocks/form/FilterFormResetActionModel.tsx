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
import { tval } from '@nocobase/utils/client';
import { DataBlockModel } from '../../base/BlockModel';
import { FilterFormActionModel } from './FilterFormActionModel';

export class FilterFormResetActionModel extends FilterFormActionModel {
  defaultProps: ButtonProps = {
    children: tval('Reset'),
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
        if (!ctx.blockModel?.form) {
          ctx.message.error(ctx.t('No form available for reset.'));
          return;
        }
        const currentBlockModel = ctx.blockModel;
        await currentBlockModel.form.reset();
        const flowEngine = ctx.engine as FlowEngine;
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
