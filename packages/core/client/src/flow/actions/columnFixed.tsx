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
  uiMode: {
    type: 'select',
    props: {
      options: [
        { label: tExpr('Not fixed'), value: 'none' },
        { label: tExpr('Left fixed'), value: 'left' },
        { label: tExpr('Right fixed'), value: 'right' },
      ],
    },
  },
  defaultParams: {
    fixed: 'none',
  },
  handler(ctx, params) {
    ctx.model.setProps('fixed', params.fixed);
  },
});
