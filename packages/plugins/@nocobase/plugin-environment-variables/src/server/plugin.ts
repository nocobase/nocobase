/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import path from 'path';
import AesEncryptor from './AesEncryptor';

export class PluginEnvironmentVariablesServer extends Plugin {
  aesEncryptor: AesEncryptor;
  updated = false;
  async load() {
    this.createAesEncryptor();
    this.registerACL();
    this.onEnvironmentSaved();
    await this.loadVariables();
  }

  async createAesEncryptor() {
    const key = await AesEncryptor.getOrGenerateKey(
      path.resolve(process.cwd(), 'storage', this.name, this.app.name, 'aes_key.dat'),
    );
    this.aesEncryptor = new AesEncryptor(key);
  }

  registerACL() {
    this.app.acl.allow('environmentVariables', 'list', 'loggedIn');
    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: ['environmentVariables:*', 'app:refresh'],
    });
  }

  async listEnvironmentVariables() {
    const repository = this.db.getRepository('environmentVariables');
    const items = await repository.find({
      sort: 'name',
    });

    return items.map(({ name, type }) => ({ name, type }));
  }

  async setEnvironmentVariablesByText(texts: Array<{ text: string; secret: boolean }>) {
    /*
    text format:
    KEY1=VALUE1
    KEY2=VALUE2
    # This is a comment
    KEY3=VALUE3
    */
    const repository = this.db.getRepository('environmentVariables');

    for (const { text, secret } of texts) {
      // Split by newline and process each line
      const lines = text
        .split('\n')
        .map((line) => line.trim()) // Remove leading/trailing spaces
        .filter((line) => line && !line.startsWith('#')); // Remove empty lines and comments

      for (const line of lines) {
        // Find first '=' to support values containing '='
        const equalIndex = line.indexOf('=');
        if (equalIndex === -1) {
          this.app.log.warn(`Invalid environment variable format: ${line}`);
          continue;
        }

        const key = line.slice(0, equalIndex).trim();
        const value = line.slice(equalIndex + 1).trim();

        if (!key || !value) {
          this.app.log.warn(`Empty key or value found: ${line}`);
          continue;
        }

        await repository.create({
          values: {
            name: key,
            type: secret ? 'secret' : 'default',
            value,
          },
        });
      }
    }
  }

  onEnvironmentSaved() {
    this.db.on('environmentVariables.afterUpdate', async (model) => {
      this.updated = true;
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
      ctx.withoutDataWrapping = true;
      ctx.body = {
        data: items,
        meta: {
          updated: this.updated,
        },
      };
      await next();
    });
    this.db.on('environmentVariables.afterSave', async (model) => {
      if (model.type === 'secret') {
        try {
          const decrypted = await this.aesEncryptor.decrypt(model.value);
          model.set('value', decrypted);
        } catch (error) {
          this.app.log.error(error);
        }
      }
      this.app.environment.setVariable(model.name, model.value);
    });
    this.db.on('environmentVariables.afterDestroy', (model) => {
      this.app.environment.removeVariable(model.name);
      this.updated = true;
    });
  }

  async loadVariables() {
    const repository = this.db.getRepository('environmentVariables');
    const r = await repository.collection.existsInDb();
    if (!r) {
      return;
    }
    const items = await repository.find();
    for (const model of items) {
      if (model.type === 'secret') {
        try {
          const decrypted = await this.aesEncryptor.decrypt(model.value);
          model.set('value', decrypted);
        } catch (error) {
          this.app.log.error(error);
        }
      }
      this.app.environment.setVariable(model.name, model.value);
    }
  }
}

export default PluginEnvironmentVariablesServer;
