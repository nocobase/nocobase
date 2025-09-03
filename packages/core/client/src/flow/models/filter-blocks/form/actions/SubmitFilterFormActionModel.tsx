/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ButtonProps } from 'antd/es/button';
import { tval } from '@nocobase/utils/client';
import { FilterFormActionModel } from './FilterFormActionModel';
import { FilterFormFieldModel } from '../fields';

export class SubmitFilterFormActionModel extends FilterFormActionModel {
  defaultProps: ButtonProps = {
    title: tval('Filter'),
    type: 'primary',
  };

  onMount(): void {
    super.onMount();
    this.context.blockModel.autoTriggerFilter = false;
  }

  onUnmount(): void {
    super.onUnmount();
    this.context.blockModel.autoTriggerFilter = true;
  }
}

SubmitFilterFormActionModel.registerFlow({
  key: 'submitSettings',
  on: {
    eventName: 'click',
  },
  steps: {
    doFilter: {
      async handler(ctx, params) {
        const blockModel = ctx.model.context.blockModel;
        const gridModel = blockModel.subModels.grid;
        const fieldModels: FilterFormFieldModel[] = gridModel.subModels.items;

        fieldModels.forEach((fieldModel) => {
          fieldModel.doFilter();
        });
      },
    },
  },
});

SubmitFilterFormActionModel.define({
  label: tval('Filter'),
});
