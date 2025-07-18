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
import _ from 'lodash';

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
      ctx.body = { verifiers: [], availableTypes: [] };
      return next();
    }
    const verifiers = await ctx.db.getRepository('verifiers').find({
      filter: {
        verificationType: verificationTypes.map((item) => item.type),
      },
    });
    ctx.body = {
      verifiers: (verifiers || []).map((item: { name: string; title: string }) => ({
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
    const verifiers = await ctx.db.getRepository('verifiers').find({
      filter: {
        verificationType: bindingRequiredTypes,
      },
    });
    const result = [];
    for (const verifier of verifiers) {
      try {
        const verificationType = plugin.verificationManager.verificationTypes.get(verifier.verificationType);
        const Verification = plugin.verificationManager.getVerification(verifier.verificationType);
        const verification = new Verification({ ctx, verifier, options: verifier.options });
        const boundInfo = await verification.getPublicBoundInfo(ctx.auth.user.id);
        result.push({
          ..._.omit(verifier.dataValues, 'options'),
          title: verifier.title || verificationType.title,
          description: verifier.description || verificationType.description,
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
    const verifiers = await ctx.db.getRepository('verifiers').find({
      filter: {
        verificationType: verificationTypes.map((item) => item.type),
      },
    });
    if (!verifiers.length) {
      ctx.body = [];
      return next();
    }
    const result = [];
    for (const verifier of verifiers) {
      const verificationType = plugin.verificationManager.verificationTypes.get(verifier.verificationType);
      const Verification = plugin.verificationManager.getVerification(verifier.verificationType);
      const verification = new Verification({ ctx, verifier, options: verifier.options });
      const publicBoundInfo = await verification.getPublicBoundInfo(ctx.auth.user.id);
      if (!publicBoundInfo?.bound) {
        continue;
      }
      result.push({
        name: verifier.name,
        title: verifier.title,
        verificationType: verifier.verificationType,
        verificationTypeTitle: verificationType?.title,
        boundInfo: publicBoundInfo,
      });
    }
    ctx.body = result;
    await next();
  },
  bind: async (ctx: Context, next: Next) => {
    const { verifier: name } = ctx.action.params.values || {};
    const user = ctx.auth.user;
    const verificationPlugin = ctx.app.pm.get('verification') as PluginVerificationServer;
    const record = await verificationPlugin.verificationManager.getBoundRecord(user.id, name);
    if (record) {
      return ctx.throw(400, ctx.t('You have already bound this verifier', { ns: pkg.name }));
    }
    const verifier = await verificationPlugin.verificationManager.getVerifier(name);
    if (!verifier) {
      return ctx.throw(400, ctx.t('Invalid verifier'));
    }
    const Verification = verificationPlugin.verificationManager.getVerification(verifier.verificationType);
    const verification = new Verification({ ctx, verifier, options: verifier.options });
    const { uuid, meta } = await verification.bind(user.id);
    await verifier.addUser(user.id, {
      through: {
        uuid,
        meta,
      },
    });
    ctx.body = {};
    await next();
  },
  unbind: async (ctx: Context, next: Next) => {
    const { unbindVerifier: name } = ctx.action.params.values || {};
    const user = ctx.auth.user;
    const verificationPlugin = ctx.app.pm.get('verification') as PluginVerificationServer;
    const verifier = await verificationPlugin.verificationManager.getVerifier(name);
    if (!verifier) {
      return ctx.throw(400, ctx.t('Invalid verifier'));
    }
    await verifier.removeUser(user.id);
    await next();
  },
};
