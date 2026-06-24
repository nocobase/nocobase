/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { resolve } from 'path';

import { createVscFileAuditActions } from './audit';
import type { VscPermissionHook } from './permissions';
import { VscPermissionHookRegistry } from './permissions';
import { createVscFileResource, vscFileActionNames } from './resources/vscFile';

export class PluginVscFileServer extends Plugin {
  private readonly permissionHooks = new VscPermissionHookRegistry();

  registerPermissionHook(hook: VscPermissionHook): () => void {
    return this.permissionHooks.register(hook);
  }

  async afterAdd() {}

  async beforeLoad() {
    if (this.options.packageName || this.db.hasCollection('vscFileRepositories')) {
      return;
    }

    await this.db.import({
      directory: resolve(__dirname, 'collections'),
    });
  }

  async load() {
    this.app.resourceManager.define(createVscFileResource(this.db, this.permissionHooks));
    this.app.acl.allow('vscFile', [...vscFileActionNames], 'loggedIn');
    this.app.auditManager.registerActions(createVscFileAuditActions(this.db));
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginVscFileServer;
