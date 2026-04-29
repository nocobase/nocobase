/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import publishCommandsResource from './resources/publish-commands';

export class PluginPublishManagerServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {}

  async beforeEnable() {
    const backupPlugin = this.app.pm.get('backups');
    const migrationPlugin = this.app.pm.get('migration-manager');
    if (!backupPlugin) {
      throw new Error('To use publish manager, you need @nocobase/plugin-backups to be enabled');
    }
    if (!migrationPlugin) {
      throw new Error('To use publish manager, you need @nocobase/plugin-migration-manager to be enabled');
    }
  }

  async load() {
    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: ['publishCommands:*'],
    });
    this.app.resourceManager.define(publishCommandsResource);
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginPublishManagerServer;
