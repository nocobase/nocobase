/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import PluginAuthEmailServer from '../../plugin';

export default {
  name: 'emailOTPProviders',
  actions: {
    list: async (ctx: Context, next: Next) => {
      const plugin = ctx.app.pm.get('@moonship1011/plugin-auth-email') as PluginAuthEmailServer;
      ctx.body = plugin.emailOTPProviderManager.listProviders();
      await next();
    },
  },
};
