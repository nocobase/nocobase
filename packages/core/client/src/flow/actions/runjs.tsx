/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineAction, escapeT } from '@nocobase/flow-engine';

export const runjs = defineAction({
  name: 'runjs',
  title: escapeT('runjs'),
  async handler(ctx, params) {
    ctx.runjs(params.code);
  },
});
