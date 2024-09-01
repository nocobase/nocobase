/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginMobileServer extends Plugin {
  async load() {
    this.app.acl.registerSnippet({
      name: `ui.${this.name}`,
      actions: ['mobileRoutes:create', 'mobileRoutes:update', 'mobileRoutes:destroy'],
    });

    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: ['mobileRoutes:list'],
    });

    this.app.acl.allow('mobileRoutes', 'list', 'loggedIn');
  }
}

export default PluginMobileServer;
