/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import PluginVerficationServer from '../Plugin';

export default {
  listTypes: async (ctx: Context, next: Next) => {
    const plugin = ctx.app.pm.get('verification') as PluginVerficationServer;
    ctx.body = plugin.verificationManager.listTypes();
    await next();
  },
  listByScene: async (ctx: Context, next: Next) => {
    const { scene } = ctx.action.params || {};
    const plugin = ctx.app.pm.get('verification') as PluginVerficationServer;
    const verificationTypes = plugin.verificationManager.getVerificationTypesByScene(scene);
    if (!verificationTypes.length) {
      return { verificators: [], availableTypes: [] };
    }
    const verificators = await ctx.db.getRepository('verificators').find({
      filter: {
        verificationType: verificationTypes.map((item) => item.type),
      },
    });
    ctx.body = {
      verificators: (verificators || []).map((item: { name: string; title: string }) => ({
        name: item.name,
        title: item.title,
      })),
      availableTypes: verificationTypes.map((item) => ({
        name: item.type,
        title: item.title,
      })),
    };
    await next();
  },
};
