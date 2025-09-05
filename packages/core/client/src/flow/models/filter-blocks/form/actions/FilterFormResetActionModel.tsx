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
import { FilterFormItemModel } from '../form-item';

export class FilterFormResetActionModel extends FilterFormActionModel {
  defaultProps: ButtonProps = {
    children: 'Reset',
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

        fieldModels.forEach((fieldModel) => {
          fieldModel.doReset();
        });

        ctx.form.resetFields();
      },
    },
  },
});

FilterFormResetActionModel.define({
  label: 'Reset',
  toggleable: true,
  sort: 200,
});
