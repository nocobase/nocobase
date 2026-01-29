/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ButtonProps } from 'antd';
import { FilterFormActionModel } from './FilterFormActionModel';
import { FilterFormItemModel } from './FilterFormItemModel';
import { tExpr } from '@nocobase/flow-engine';

export class FilterFormResetActionModel extends FilterFormActionModel {
  defaultProps: ButtonProps = {
    title: tExpr('Reset'),
  };
}

FilterFormResetActionModel.registerFlow({
  key: 'resetSettings',
  on: {
    eventName: 'click',
  },
  steps: {
    doReset: {
      async handler(ctx, params) {
        const blockModel = ctx.model.context.blockModel;
        const gridModel = blockModel.subModels.grid;
        const fieldModels: FilterFormItemModel[] = gridModel.subModels.items;

        ctx.form.resetFields();

        // 等待表单值被清空
        setTimeout(() => {
          void blockModel.applyFormDefaultValues?.({ force: true }).finally(() => {
            fieldModels.forEach((fieldModel) => {
              fieldModel.doReset();
            });
          });
        });
      },
    },
  },
});

FilterFormResetActionModel.define({
  label: tExpr('Reset'),
  toggleable: true,
  sort: 200,
});
