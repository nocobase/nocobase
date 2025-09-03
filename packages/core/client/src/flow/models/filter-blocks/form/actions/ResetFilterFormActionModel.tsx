/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ButtonProps } from 'antd';
import { FilterFormFieldModel } from '../fields';
import { FilterFormActionModel } from './FilterFormActionModel';

export class ResetFilterFormActionModel extends FilterFormActionModel {
  defaultProps: ButtonProps = {
    children: 'Reset',
  };
}

ResetFilterFormActionModel.registerFlow({
  key: 'resetSettings',
  on: {
    eventName: 'click',
  },
  steps: {
    doReset: {
      async handler(ctx, params) {
        const blockModel = ctx.model.context.blockModel;
        const gridModel = blockModel.subModels.grid;
        const fieldModels: FilterFormFieldModel[] = gridModel.subModels.items;

        fieldModels.forEach((fieldModel) => {
          fieldModel.field.reset();
          fieldModel.doReset();
        });
      },
    },
  },
});

ResetFilterFormActionModel.define({
  label: 'Reset',
});
