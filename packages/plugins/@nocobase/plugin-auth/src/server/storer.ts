/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { AuthManager, Authenticator, Storer as IStorer } from '@nocobase/auth';
import { Cache } from '@nocobase/cache';
import { Database } from '@nocobase/database';
import { Application } from '@nocobase/server';
import lodash from 'lodash';
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
      // Keep the cached configuration raw. The corresponding auth type may not have
      // been registered yet while plugins are loading, so rendering here can destroy
      // auth-type-specific template variables.
      await this.cache.setValueInObject(this.key, model.name, this.toRawAuthenticator(model));
    });
    this.db.on('authenticators.afterDestroy', async (model: AuthModel) => {
      await this.cache.delValueInObject(this.key, model.name);
    });
  }

  private toRawAuthenticator(authenticator: any): Authenticator {
    if (!authenticator) {
      return authenticator;
    }

    const raw =
      typeof authenticator.toJSON === 'function'
        ? authenticator.toJSON()
        : authenticator.dataValues || authenticator;

    // Never mutate an ORM instance or a cached object while preparing runtime options.
    return lodash.cloneDeep(raw);
  }

  renderJsonTemplate(authenticator: any): Authenticator {
    const raw = this.toRawAuthenticator(authenticator);
    if (!raw) {
      return raw;
    }

    const $env = this.app?.environment;
    if (!$env) {
      return raw;
    }

    // Auth-type options may contain templates that are not environment variables.
    // Without the registered auth config, we cannot know which keys must be omitted
    // from environment rendering. Preserve the raw options until the type is available.
    const config = this.authManager?.getAuthConfig(raw.authType);
    if (!config?.auth) {
      return raw;
    }

    raw.options = $env.renderJsonTemplate(raw.options, {
      omit: config.auth['optionsKeysNotAllowedInEnv'],
    });
    return raw;
  }

  async getCache(): Promise<Authenticator[]> {
    const authenticators = (await this.cache.get(this.key)) as Record<string, Authenticator>;
    if (!authenticators) {
      return [];
    }
    return Object.values(authenticators);
  }

  async setCache(authenticators: Authenticator[]) {
    const obj: Record<string, Authenticator> = {};
    for (const authenticator of authenticators) {
      // Store the unrendered options so a cache populated before plugin registration
      // remains valid after the auth type is registered.
      obj[authenticator.name] = this.toRawAuthenticator(authenticator);
    }
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
    const authenticator = authenticators.find((authenticator) => authenticator.name === name) || authenticators[0];
    return this.renderJsonTemplate(authenticator);
  }
}
