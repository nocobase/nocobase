/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr } from '@nocobase/flow-engine';

export const fixed = defineAction({
  title: tExpr('Fixed'),
  name: 'fixed',
  uiMode: (ctx) => {
    const t = ctx.t;
    return {
      type: 'select',
      key: 'fixed',
      props: {
        options: [
          { label: t('Not fixed'), value: 'none' },
          { label: t('Left fixed'), value: 'left' },
          { label: t('Right fixed'), value: 'right' },
        ],
      },
    };
  },
  defaultParams: {
    fixed: 'none',
  },
  handler(ctx, params) {
    ctx.model.setProps('fixed', params.fixed);
  },
});
