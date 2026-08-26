/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, tExpr } from '@nocobase/flow-engine';
import { TableColumnModel } from '../models/blocks/table';

export const renderMode = defineAction({
  title: tExpr('Render mode'),
  name: 'renderMode',
  uiMode(ctx) {
    const t = ctx.t;
    return {
      type: 'select',
      key: 'textOnly',
      props: {
        options: [
          { label: t('Text only'), value: true },
          { label: t('Html'), value: false },
        ],
      },
    };
  },
  hideInSettings: async (ctx) => {
    const overflowMode = ctx.model.getStepParams?.('displayFieldSettings', 'overflowMode')?.overflowMode;
    if (overflowMode === undefined) {
      return ctx.model.parent instanceof TableColumnModel;
    }
    return overflowMode === true || overflowMode === 'ellipsis';
  },
  defaultParams: {
    textOnly: true,
  },
  handler(ctx, params) {
    ctx.model.setProps({ textOnly: params.textOnly });
  },
});
