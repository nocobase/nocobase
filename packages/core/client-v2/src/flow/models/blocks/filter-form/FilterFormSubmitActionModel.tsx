/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ButtonProps } from 'antd/es/button';
import { tExpr } from '@nocobase/flow-engine';
import { FilterFormActionModel } from './FilterFormActionModel';

export class FilterFormSubmitActionModel extends FilterFormActionModel {
  defaultProps: ButtonProps = {
    title: tExpr('Filter'),
    type: 'primary',
  };

  onInit(options): void {
    super.onInit(options);
    this.context.blockModel.autoTriggerFilter = false;
  }

  onUnmount(): void {
    super.onUnmount();
    this.context.blockModel.autoTriggerFilter = true;
  }
}

FilterFormSubmitActionModel.registerFlow({
  key: 'submitSettings',
  on: {
    eventName: 'click',
  },
  steps: {
    doFilter: {
      async handler(ctx, params) {
        ctx.form.submit();
      },
    },
  },
});

FilterFormSubmitActionModel.define({
  label: tExpr('Filter'),
  toggleable: true,
  sort: 100,
});
