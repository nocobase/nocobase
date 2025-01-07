/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AuthManager, Storer as IStorer } from '@nocobase/auth';
import { Cache } from '@nocobase/cache';
import { Database, Model } from '@nocobase/database';
import { Application } from '@nocobase/server';
import { AuthModel } from './model/authenticator';

export class Storer implements IStorer {
  db: Database;
  cache: Cache;
  app: Application;
  authManager: AuthManager;
  key = 'authenticators';

  constructor({
    app,
    db,
    cache,
    authManager,
  }: {
    app?: Application;
    db: Database;
    cache: Cache;
    authManager: AuthManager;
  }) {
    this.app = app;
    this.db = db;
    this.cache = cache;
    this.authManager = authManager;

    this.db.on('authenticators.afterSave', async (model: AuthModel) => {
      if (!model.enabled) {
        await this.cache.delValueInObject(this.key, model.name);
        return;
      }
      await this.cache.setValueInObject(this.key, model.name, this.renderJsonTemplate(model));
    });
    this.db.on('authenticators.afterDestroy', async (model: AuthModel) => {
      await this.cache.delValueInObject(this.key, model.name);
    });
  }

  renderJsonTemplate(authenticator: any) {
    if (!authenticator) {
      return authenticator;
    }
    const $env = this.app?.environment;
    if (!$env) {
      return authenticator;
    }
    const config = this.authManager.getAuthConfig(authenticator.authType);
    authenticator.dataValues.options = $env.renderJsonTemplate(authenticator.dataValues.options, {
      omit: config?.auth?.['optionsKeysNotAllowedInEnv'],
    });
    return authenticator;
  }

  async getCache(): Promise<AuthModel[]> {
    const authenticators = (await this.cache.get(this.key)) as Record<string, AuthModel>;
    if (!authenticators) {
      return [];
    }
    return Object.values(authenticators);
  }

  async setCache(authenticators: AuthModel[]) {
    const obj = authenticators.reduce((obj, authenticator) => {
      obj[authenticator.name] = this.renderJsonTemplate(authenticator);
      return obj;
    }, {});
    await this.cache.set(this.key, obj);
  }

  async get(name: string) {
    let authenticators = await this.getCache();
    if (!authenticators.length) {
      const repo = this.db.getRepository('authenticators');
      authenticators = await repo.find({ filter: { enabled: true } });
      await this.setCache(authenticators);
      authenticators = await this.getCache();
    }
    const authenticator = authenticators.find((authenticator: Model) => authenticator.name === name);
    return authenticator || authenticators[0];
  }
}
