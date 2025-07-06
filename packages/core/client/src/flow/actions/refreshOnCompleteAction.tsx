/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { tval } from '@nocobase/utils/client';

export const refreshOnCompleteAction = {
  title: tval('Refresh data after execution'),
  uiSchema: {
    enable: {
      type: 'boolean',
      title: tval('Enable refresh'),
      'x-decorator': 'FormItem',
      'x-component': 'Checkbox',
    },
  },
  defaultParams(ctx) {
    return {
      enable: true,
    };
  },
  async handler(ctx, params) {
    if (params.enable) {
      await ctx.runtimeArgs.currentResource.refresh();
      ctx.globals.message.success(ctx.model.translate('Data refreshed successfully'));
    }
  },
};
