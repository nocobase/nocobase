/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, MultiRecordResource } from '@nocobase/flow-engine';
import type { ButtonProps, ButtonType } from 'antd/es/button';
import { tval } from '@nocobase/utils/client';
import { ActionModel } from '../../base/ActionModel';
import { DataBlockModel } from '../../base/BlockModel';
import { FilterFormActionModel } from './FilterFormActionModel';

export class FilterFormSubmitActionModel extends FilterFormActionModel {
  defaultProps: ButtonProps = {
    children: tval('Filter'),
    type: 'primary',
  };
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
          ctx.globals.message.error(ctx.globals.flowEngine.translate('No form available for submission.'));
          return;
        }
        const currentBlockModel = ctx.shared.currentBlockModel;
        await currentBlockModel.form.submit();
        const values = currentBlockModel.form.values;
        const flowEngine = ctx.globals.flowEngine as FlowEngine;
        flowEngine.forEachModel((model: DataBlockModel) => {
          if (model.resource && model?.collection?.name === currentBlockModel.collection.name) {
            (model.resource as MultiRecordResource).addFilterGroup(currentBlockModel.uid, values);
            (model.resource as MultiRecordResource).refresh();
          }
        });
      },
    },
  },
});
