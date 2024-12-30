/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import _ from 'lodash';
import path from 'path';
import AesEncryptor from './AesEncryptor';

export class PluginEnvironmentVariablesServer extends Plugin {
  aesEncryptor: AesEncryptor;
  async load() {
    this.createAesEncryptor();
    this.registerACL();
    this.onEnvironmentSaved();
    await this.loadVariables();
  }

  async createAesEncryptor() {
    const key = await AesEncryptor.getOrGenerateKey(
      path.resolve(process.cwd(), 'storage', '.data', this.name, 'aes_key.dat'),
    );
    this.aesEncryptor = new AesEncryptor(key);
  }

  registerACL() {
    this.app.acl.allow('environmentVariables', 'list', 'loggedIn');
    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: ['environmentVariables:*'],
    });
  }

  onEnvironmentSaved() {
    this.db.on('environmentVariables.afterFind', async (instances) => {
      const models = _.castArray(instances);
      for (const model of models) {
        if (model.type === 'secret') {
          try {
            const decrypted = await this.aesEncryptor.decrypt(model.value);
            model.set('value', decrypted);
          } catch (error) {
            //
          }
        }
      }
    });
    this.db.on('environmentVariables.beforeSave', async (model) => {
      if (model.type === 'secret' && model.changed('value')) {
        const encrypted = await this.aesEncryptor.encrypt(model.value);
        model.set('value', encrypted);
      }
    });
    this.app.resourceManager.registerActionHandler('environmentVariables:list', async (ctx, next) => {
      const repository = this.db.getRepository('environmentVariables');
      const items = await repository.find({
        sort: 'name',
      });
      for (const model of items) {
        if (model.type === 'secret') {
          model.set('value', undefined);
        }
      }
      ctx.body = items;
      await next();
    });
    this.db.on('environmentVariables.afterSave', async (model) => {
      this.app.environment.setVariable(model.name, model.value);
    });
    this.db.on('environmentVariables.afterDestroy', (model) => {
      this.app.environment.removeVariable(model.name);
    });
  }

  async loadVariables() {
    const repository = this.db.getRepository('environmentVariables');
    const r = await repository.collection.existsInDb();
    if (!r) {
      return;
    }
    const items = await repository.find();
    for (const item of items) {
      this.app.environment.setVariable(item.name, item.value);
    }
  }
}

export default PluginEnvironmentVariablesServer;
