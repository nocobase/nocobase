/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginEnvironmentsServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async load() {
    this.onEnvironmentSaved();
    await this.loadVariables();
    await this.loadSecrets();
    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: ['environmentVariables.*', 'environmentSecrets.*'],
    });
  }

  onEnvironmentSaved() {
    this.db.on('environmentVariables.afterSave', async (model) => {
      this.app.environment.setVariable(model.name, model.value);
    });
    this.db.on('environmentSecrets.afterSave', async (model) => {
      this.app.environment.setSecret(model.name, model.value);
    });
    this.db.on('environmentVariables.afterDestroy', (model) => {
      this.app.environment.removeVariable(model.name);
    });
    this.db.on('environmentSecrets.afterDestroy', (model) => {
      this.app.environment.removeSecret(model.name);
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

  async loadSecrets() {
    const repository = this.db.getRepository('environmentSecrets');
    const r = await repository.collection.existsInDb();
    if (!r) {
      return;
    }
    const items = await repository.find();
    for (const item of items) {
      this.app.environment.setSecret(item.name, item.value);
    }
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginEnvironmentsServer;
