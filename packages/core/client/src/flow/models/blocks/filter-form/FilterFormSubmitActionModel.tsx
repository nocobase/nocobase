/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tval } from '@nocobase/utils/client';
import type { ButtonProps } from 'antd/es/button';
import { FilterFormActionModel } from './FilterFormActionModel';
import { FilterFormItemModel } from './FilterFormItemModel';

export class FilterFormSubmitActionModel extends FilterFormActionModel {
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
  label: tval('Filter'),
  toggleable: true,
  sort: 100,
});
