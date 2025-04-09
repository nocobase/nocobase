/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import PluginVerficationServer from '../../../Plugin';

export default {
  name: 'smsOTPProviders',
  actions: {
    list: async (ctx: Context, next: Next) => {
      const plugin = ctx.app.pm.get('verification') as PluginVerficationServer;
      ctx.body = plugin.smsOTPProviderManager.listProviders();
      await next();
    },
  },
};
