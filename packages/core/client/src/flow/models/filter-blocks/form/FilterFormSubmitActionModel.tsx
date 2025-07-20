/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowEngine, MultiRecordResource } from '@nocobase/flow-engine';
import { tval } from '@nocobase/utils/client';
import type { ButtonProps, ButtonType } from 'antd/es/button';
import { ActionModel } from '../../base/ActionModel';
import { CollectionBlockModel } from '../../base/BlockModel';
import { FilterFormActionModel } from './FilterFormActionModel';

export class FilterFormSubmitActionModel extends FilterFormActionModel {
  defaultProps: ButtonProps = {
    title: tval('Filter'),
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
        if (!ctx.blockModel?.form) {
          ctx.message.error(ctx.t('No form available for submission.'));
          return;
        }
        const currentBlockModel = ctx.blockModel;
        await currentBlockModel.form.submit();
        const values = currentBlockModel.form.values;
        const flowEngine = ctx.engine as FlowEngine;
        flowEngine.forEachModel((model: CollectionBlockModel) => {
          if (model.resource && model?.collection?.name === currentBlockModel.collection.name) {
            (model.resource as MultiRecordResource).addFilterGroup(currentBlockModel.uid, values);
            (model.resource as MultiRecordResource).refresh();
          }
        });
      },
    },
  },
});
