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
  /**
   * Authenticators that were cached before their auth type was registered. Their options are kept
   * as-is and rendered on the first read after the auth type becomes available.
   */
  private pendingRender = new Set<string>();

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
        this.pendingRender.delete(model.name);
        await this.cache.delValueInObject(this.key, model.name);
        return;
      }
      await this.cache.setValueInObject(this.key, model.name, this.prepare(model));
    });
    this.db.on('authenticators.afterDestroy', async (model: AuthModel) => {
      this.pendingRender.delete(model.name);
      await this.cache.delValueInObject(this.key, model.name);
    });
  }

  private getAuthConfig(authType: string) {
    return this.authManager?.getAuthConfig?.(authType);
  }

  private prepare(authenticator: AuthModel) {
    if (!authenticator) {
      return authenticator;
    }
    if (!this.getAuthConfig(authenticator.authType)) {
      this.pendingRender.add(authenticator.name);
      return authenticator;
    }
    this.pendingRender.delete(authenticator.name);
    return this.renderJsonTemplate(authenticator);
  }

  renderJsonTemplate(authenticator: any) {
    if (!authenticator) {
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
    authenticator.dataValues.options = $env.renderJsonTemplate(authenticator.dataValues.options, {
      omit: config.auth?.['optionsKeysNotAllowedInEnv'],
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
    if (authenticator && this.pendingRender.has(authenticator.name) && this.getAuthConfig(authenticator.authType)) {
      const rendered = this.renderJsonTemplate(authenticator);
      await this.cache.setValueInObject(this.key, authenticator.name, rendered);
      this.pendingRender.delete(authenticator.name);
      return rendered;
    }
    return authenticator;
  }
}
