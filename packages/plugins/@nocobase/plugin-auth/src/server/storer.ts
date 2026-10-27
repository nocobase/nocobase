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

const RENDERED = Symbol('authenticatorOptionsRendered');

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
      await this.cache.setValueInObject(this.key, model.name, this.prepare(model));
    });
    this.db.on('authenticators.afterDestroy', async (model: AuthModel) => {
      await this.cache.delValueInObject(this.key, model.name);
    });
  }

  private getAuthConfig(authType: string) {
    return this.authManager?.getAuthConfig?.(authType);
  }

  private prepare(authenticator: AuthModel) {
    return this.renderJsonTemplate(authenticator);
  }

  renderJsonTemplate(authenticator: any) {
    if (!authenticator) {
      return authenticator;
    }
    const options = authenticator.dataValues?.options;
    // The mark is the rendered options object itself, so replacing the options (for example by saving
    // the same model again) invalidates it, while unchanged options keep the render-once behavior.
    if (options && authenticator[RENDERED] === options) {
      return authenticator;
    }
    const $env = this.app?.environment;
    const config = this.getAuthConfig(authenticator.authType);
    // The auth type is registered by its own plugin, which may not be loaded yet while the
    // application is starting or reloading. Rendering in that window would treat business
    // placeholders such as `{{account}}` as environment variables and replace them with an empty string.
    if (!$env || !config) {
      return authenticator;
    }
    authenticator.dataValues.options = $env.renderJsonTemplate(options, {
      omit: config.auth?.['optionsKeysNotAllowedInEnv'],
    });
    authenticator[RENDERED] = authenticator.dataValues.options;
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
      obj[authenticator.name] = this.prepare(authenticator);
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
    const authenticator =
      authenticators.find((authenticator: Model) => authenticator.name === name) || authenticators[0];
    // Render the cached entry in place. Re-writing it by name could resurrect an entry that was
    // disabled or deleted while its options were being rendered.
    return this.renderJsonTemplate(authenticator);
  }
}
