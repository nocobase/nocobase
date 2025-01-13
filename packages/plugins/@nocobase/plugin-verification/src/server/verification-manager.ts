/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Registry } from '@nocobase/utils';
import { Verification, VerificationExtend } from './verification';
import { Context, Next } from '@nocobase/actions';
import PluginVerficationServer from './Plugin';
import { Database } from '@nocobase/database';

export type VerificationTypeOptions = {
  title: string;
  verification: VerificationExtend<Verification>;
};

type SceneRule = (scene: string, verificationType: string) => boolean;

export interface ActionOptions {
  manual?: boolean;
  getUserInfoFromCtx?(ctx: Context): any | Promise<any>;
  getVerifyParams?(ctx: Context): any | Promise<any>;
}

export class VerificationManager {
  db: Database;
  verificationTypes = new Registry<VerificationTypeOptions>();
  sceneRules = new Array<SceneRule>();
  actions = new Registry<ActionOptions>();

  constructor({ db }) {
    this.db = db;
  }

  registerVerificationType(type: string, options: VerificationTypeOptions) {
    this.verificationTypes.register(type, options);
  }

  listTypes() {
    return Array.from(this.verificationTypes.getEntities()).map(([verificationType, options]) => ({
      name: verificationType,
      title: options.title,
    }));
  }

  addSceneRule(rule: SceneRule) {
    this.sceneRules.push(rule);
  }

  registerAction(action: string, options: ActionOptions) {
    this.actions.register(action, options);
  }

  getVerificationTypesByScene(scene: string) {
    const verificationTypes = [];
    for (const [type, options] of this.verificationTypes.getEntities()) {
      const item = { type, title: options.title };
      if (this.sceneRules.some((rule) => rule(scene, type))) {
        verificationTypes.push(item);
      }
    }
    return verificationTypes;
  }

  getVerification(type: string) {
    const verificationType = this.verificationTypes.get(type);
    if (!verificationType) {
      throw new Error(`Invalid verification type: ${type}`);
    }
    return verificationType.verification;
  }

  async getVerificators(verificatorNames: string[]) {
    return await this.db.getRepository('verificators').find({
      filter: {
        name: verificatorNames,
      },
    });
  }

  // verify manually
  async verify(ctx: Context, next: Next) {
    const { resourceName, actionName } = ctx.action;
    const key = `${resourceName}:${actionName}`;
    const action = this.actions.get(key);
    if (!action) {
      ctx.throw(400, 'Invalid action');
    }
    const verificatorName = ctx.action.params.values?.verificator;
    if (!verificatorName) {
      ctx.throw(400, 'Invalid verificator');
    }
    const verificator = await ctx.db.getRepository('verificators').findOne({
      filterByTk: verificatorName,
    });
    if (!verificator) {
      ctx.throw(400, 'Invalid verificator');
    }
    let userInfo: any;
    if (action.getUserInfoFromCtx) {
      userInfo = await action.getUserInfoFromCtx(ctx);
      if (!userInfo) {
        ctx.throw(400, 'Invalid user info');
      }
    }
    const verifyParams = action.getVerifyParams ? await action.getVerifyParams(ctx) : ctx.action.params.values;
    if (!verifyParams) {
      ctx.throw(400, 'Invalid verify params');
    }
    const plugin = ctx.app.pm.get('verification') as PluginVerficationServer;
    const verificationManager = plugin.verificationManager;
    const Verification = verificationManager.getVerification(verificator.verificationType);
    const verification = new Verification({ ctx, name: verificator.name, options: verificator.options });
    const verifyResult = await verification.verify({
      resource: resourceName,
      action: actionName,
      userInfo,
      verifyParams,
    });
    try {
      await next();
    } finally {
      await verification.postAction({ verifyResult });
    }
  }

  middleware() {
    const self = this;
    return async function verificationMiddleware(ctx: Context, next: Next) {
      const { resourceName, actionName } = ctx.action;
      const key = `${resourceName}:${actionName}`;
      const action = self.actions.get(key);
      if (!action || action.manual) {
        return next();
      }
      return self.verify(ctx, next);
    };
  }
}
