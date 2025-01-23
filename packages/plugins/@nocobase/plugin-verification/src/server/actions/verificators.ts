/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Context, Next } from '@nocobase/actions';
import PluginVerificationServer from '../Plugin';
import pkg from '../../../package.json';

export default {
  listTypes: async (ctx: Context, next: Next) => {
    const plugin = ctx.app.pm.get('verification') as PluginVerificationServer;
    ctx.body = plugin.verificationManager.listTypes();
    await next();
  },
  listByScene: async (ctx: Context, next: Next) => {
    const { scene } = ctx.action.params || {};
    const plugin = ctx.app.pm.get('verification') as PluginVerificationServer;
    const verificationTypes = plugin.verificationManager.getVerificationTypesByScene(scene);
    if (!verificationTypes.length) {
      ctx.body = { verificators: [], availableTypes: [] };
      return next();
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
  listByUser: async (ctx: Context, next: Next) => {
    const plugin = ctx.app.pm.get('verification') as PluginVerificationServer;
    const verificationTypes = plugin.verificationManager.verificationTypes;
    const bindingRequiredTypes = Array.from(verificationTypes.getEntities())
      .filter(([, options]) => options.bindingRequired)
      .map(([type]) => type);
    const verificators = await ctx.db.getRepository('verificators').find({
      filter: {
        verificationType: bindingRequiredTypes,
      },
    });
    const result = [];
    for (const verificator of verificators) {
      try {
        const verificationType = plugin.verificationManager.verificationTypes.get(verificator.verificationType);
        const Verification = plugin.verificationManager.getVerification(verificator.verificationType);
        const verification = new Verification({ ctx, verificator, options: verificator.options });
        const boundInfo = await verification.getPublicBoundInfo(ctx.auth.user.id);
        result.push({
          ...verificator.dataValues,
          title: verificator.title || verificationType.title,
          description: verificator.description || verificationType.description,
          boundInfo,
        });
      } catch (error) {
        ctx.log.error(error);
      }
    }
    ctx.body = result;
    await next();
  },
  listForVerify: async (ctx: Context, next: Next) => {
    const { scene } = ctx.action.params || {};
    const plugin = ctx.app.pm.get('verification') as PluginVerificationServer;
    const verificationTypes = plugin.verificationManager.getVerificationTypesByScene(scene);
    if (!verificationTypes.length) {
      ctx.body = [];
      return next();
    }
    const verificators = await ctx.db.getRepository('verificators').find({
      filter: {
        verificationType: verificationTypes.map((item) => item.type),
      },
    });
    if (!verificators.length) {
      ctx.body = [];
      return next();
    }
    const result = [];
    for (const verificator of verificators) {
      const verificationType = plugin.verificationManager.verificationTypes.get(verificator.verificationType);
      const Verification = plugin.verificationManager.getVerification(verificator.verificationType);
      const verification = new Verification({ ctx, verificator, options: verificator.options });
      const publicBoundInfo = await verification.getPublicBoundInfo(ctx.auth.user.id);
      if (!publicBoundInfo?.bound) {
        continue;
      }
      result.push({
        name: verificator.name,
        title: verificator.title,
        verificationType: verificator.verificationType,
        verificationTypeTitle: verificationType?.title,
        boundInfo: publicBoundInfo,
      });
    }
    ctx.body = result;
    await next();
  },
  bind: async (ctx: Context, next: Next) => {
    const { verificator: name } = ctx.action.params.values || {};
    const user = ctx.auth.user;
    const verificationPlugin = ctx.app.pm.get('verification') as PluginVerificationServer;
    const record = await verificationPlugin.verificationManager.getBoundRecord(user.id, name);
    if (record) {
      return ctx.throw(400, ctx.t('You have already bound this verificator', { ns: pkg.name }));
    }
    const verificator = await verificationPlugin.verificationManager.getVerificator(name);
    if (!verificator) {
      return ctx.throw(400, ctx.t('Invalid verificator'));
    }
    const Verification = verificationPlugin.verificationManager.getVerification(verificator.verificationType);
    const verification = new Verification({ ctx, verificator, options: verificator.options });
    const { uuid, meta } = await verification.bind(user.id);
    await verificator.addUser(user.id, {
      through: {
        uuid,
        meta,
      },
    });
    ctx.body = {};
    await next();
  },
  unbind: async (ctx: Context, next: Next) => {
    const { unbindVerificator: name } = ctx.action.params.values || {};
    const user = ctx.auth.user;
    const verificationPlugin = ctx.app.pm.get('verification') as PluginVerificationServer;
    const verificator = await verificationPlugin.verificationManager.getVerificator(name);
    if (!verificator) {
      return ctx.throw(400, ctx.t('Invalid verificator'));
    }
    await verificator.removeUser(user.id);
    await next();
  },
};
