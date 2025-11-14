/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr } from '@nocobase/flow-engine';

export const dataLoadingMode = defineAction({
  name: 'dataLoadingMode',
  title: tExpr('Data loading mode'),
  uiSchema: {
    dataLoadingMode: {
      'x-decorator': 'FormItem',
      'x-component': 'Radio.Group',
      enum: [
        { value: 'auto', label: tExpr('Load all data when filter is empty') },
        { value: 'manual', label: tExpr('Do not load data when filter is empty') },
      ],
    },
  },
  defaultParams(ctx) {
    return {
      dataLoadingMode: 'auto',
    };
  },
  async handler(ctx, params) {
    ctx.model.setProps('dataLoadingMode', params.dataLoadingMode);
  },
});
