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
import { Database, Model } from '@nocobase/database';

export type VerificationTypeOptions = {
  title: string;
  description?: string;
  bindingRequired?: boolean;
  verification: VerificationExtend<Verification>;
};

type SceneRule = (scene: string, verificationType: string) => boolean;

export interface ActionOptions {
  manual?: boolean;
  getUserIdFromCtx?(ctx: Context): number | Promise<number>;
  getBoundInfoFromCtx?(ctx: Context): any | Promise<any>;
  getVerifyParams?(ctx: Context): any | Promise<any>;
  onVerifySuccess?(ctx: Context, userId: number, verifyResult: any): any | Promise<any>;
  onVerifyFail?(ctx: Context, err: Error, userId: number): any | Promise<any>;
}

export interface SceneOptions {
  actions: {
    [key: string]: ActionOptions;
  };
  getVerificators?(ctx: Context): Promise<string[]>;
}

export class VerificationManager {
  db: Database;
  verificationTypes = new Registry<VerificationTypeOptions>();
  scenes = new Registry<SceneOptions>();
  sceneRules = new Array<SceneRule>();
  actions = new Registry<ActionOptions & { scene?: string }>();

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

  registerScene(scene: string, options: SceneOptions) {
    this.scenes.register(scene, options);
    const { actions } = options;
    for (const [action, actionOptions] of Object.entries(actions)) {
      this.actions.register(action, {
        ...actionOptions,
        scene,
      });
    }
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

  async getVerificator(verificatorName: string) {
    return await this.db.getRepository('verificators').findOne({
      filter: {
        name: verificatorName,
      },
    });
  }

  async getVerificators(verificatorNames: string[]) {
    return await this.db.getRepository('verificators').find({
      filter: {
        name: verificatorNames,
      },
    });
  }

  async getBoundRecord(userId: number, verificator: string) {
    return await this.db.getRepository('usersVerificators').findOne({
      filter: {
        userId,
        verificator,
      },
    });
  }

  async getAndValidateBoundInfo(ctx: Context, action: ActionOptions, verification: Verification) {
    let userId: number;
    let boundInfo: { uuid: string };
    if (action.getBoundInfoFromCtx) {
      boundInfo = await action.getBoundInfoFromCtx(ctx);
    } else {
      if (action.getUserIdFromCtx) {
        userId = await action.getUserIdFromCtx(ctx);
      } else {
        userId = ctx.auth?.user?.id;
      }
      if (!userId) {
        ctx.throw(400, 'Invalid user id');
      }
      boundInfo = await verification.getBoundInfo(userId);
    }
    await verification.validateBoundInfo(boundInfo);
    return { boundInfo, userId };
  }

  private async validateAndGetVerificator(ctx: Context, scene: string, verificatorName: string) {
    let verificator: Model;
    if (!verificatorName) {
      return null;
    }
    if (scene) {
      const sceneOptions = this.scenes.get(scene);
      if (sceneOptions.getVerificators) {
        const verificators = await sceneOptions.getVerificators(ctx);
        if (!verificators.includes(verificatorName)) {
          return null;
        }
        verificator = await this.getVerificator(verificatorName);
        if (!verificator) {
          return null;
        }
      } else {
        const verificationTypes = this.getVerificationTypesByScene(scene);
        const verificators = await this.db.getRepository('verificators').find({
          filter: {
            verificationType: verificationTypes.map((item) => item.type),
          },
        });
        verificator = verificators.find((item: { name: string }) => item.name === verificatorName);
        if (!verificator) {
          return null;
        }
      }
    } else {
      verificator = await this.getVerificator(verificatorName);
      if (!verificator) {
        return null;
      }
    }
    return verificator;
  }

  // verify manually
  async verify(ctx: Context, next: Next) {
    const { resourceName, actionName } = ctx.action;
    const key = `${resourceName}:${actionName}`;
    const action = this.actions.get(key);
    if (!action) {
      ctx.throw(400, 'Invalid action');
    }
    const { verificator: verificatorName } = ctx.action.params.values || {};
    const verificator = await this.validateAndGetVerificator(ctx, action.scene, verificatorName);
    if (!verificator) {
      ctx.throw(400, 'Invalid verificator');
    }
    const verifyParams = action.getVerifyParams ? await action.getVerifyParams(ctx) : ctx.action.params.values;
    if (!verifyParams) {
      ctx.throw(400, 'Invalid verify params');
    }
    const plugin = ctx.app.pm.get('verification') as PluginVerficationServer;
    const verificationManager = plugin.verificationManager;
    const Verification = verificationManager.getVerification(verificator.verificationType);
    const verification = new Verification({ ctx, verificator, options: verificator.options });
    const { boundInfo, userId } = await this.getAndValidateBoundInfo(ctx, action, verification);
    try {
      const verifyResult = await verification.verify({
        resource: resourceName,
        action: actionName,
        userId,
        boundInfo,
        verifyParams,
      });
      try {
        await action.onVerifySuccess?.(ctx, userId, verifyResult);
        await next();
      } catch (err) {
        ctx.log.error(err, { module: 'verification', method: 'verify' });
        throw err;
      } finally {
        await verification.onActionComplete({ userId, verifyResult });
      }
    } catch (err) {
      await action.onVerifyFail?.(ctx, err, userId);
      throw err;
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
