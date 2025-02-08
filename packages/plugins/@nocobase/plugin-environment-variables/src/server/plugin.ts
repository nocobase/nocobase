/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginEnvironmentVariablesServer extends Plugin {
  updated = false;

  get aesEncryptor() {
    return this.app.aesEncryptor;
  }

  async handleSyncMessage(message) {
    const { type, name, value } = message;
    if (type === 'updated') {
      this.updated = true;
    } else if (type === 'setVariable') {
      this.app.environment.setVariable(name, value);
    } else if (type === 'removeVariable') {
      this.app.environment.removeVariable(name);
      this.updated = true;
    }
  }

  async load() {
    this.registerACL();
    this.onEnvironmentSaved();
    await this.loadVariables();
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

  public validateTexts(texts: Array<{ text: string; secret: boolean }>) {
    if (!Array.isArray(texts)) {
      throw new Error('texts parameter must be an array');
    }

    for (const item of texts) {
      if (!item || typeof item !== 'object') {
        throw new Error('Each item in texts must be an object');
      }

      if (typeof item.text !== 'string' || !item.text.trim()) {
        throw new Error('text property must be a non-empty string');
      }

      if (typeof item.secret !== 'boolean') {
        throw new Error('secret property must be a boolean');
      }

      // Check each line for empty values
      const lines = item.text
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'));

      for (const line of lines) {
        const equalIndex = line.indexOf('=');
        if (equalIndex === -1) {
          throw new Error(`Invalid environment variable format: ${line}`);
        }

        const key = line.slice(0, equalIndex).trim();
        const value = line.slice(equalIndex + 1).trim();

        if (!key) {
          throw new Error(`Environment variable name cannot be empty`);
        }

        if (!value) {
          throw new Error(`Environment variable "${key}" must have a value`);
        }
      }
    }
  }

  async setEnvironmentVariablesByText(texts: Array<{ text: string; secret: boolean }>) {
    this.validateTexts(texts);

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

        if (!key) {
          this.app.log.warn(`Empty key found: ${line}`);
          continue;
        }

        if (!value) {
          throw new Error(`Empty value is not allowed for key: ${key}`);
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
    this.db.on('environmentVariables.afterUpdate', async (model, { transaction }) => {
      this.updated = true;
      this.sendSyncMessage({ type: 'updated' }, { transaction });
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
        filter: ctx.action.params.filter,
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
    this.db.on('environmentVariables.afterSave', async (model, { transaction }) => {
      if (model.type === 'secret') {
        try {
          const decrypted = await this.aesEncryptor.decrypt(model.value);
          model.set('value', decrypted);
        } catch (error) {
          this.app.log.error(error);
        }
      }
      this.app.environment.setVariable(model.name, model.value);
      this.sendSyncMessage({ type: 'setVariable', name: model.name, value: model.value }, { transaction });
    });
    this.db.on('environmentVariables.afterDestroy', async (model, { transaction }) => {
      this.app.environment.removeVariable(model.name);
      this.updated = true;
      this.sendSyncMessage({ type: 'removeVariable', name: model.name }, { transaction });
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
