/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { destroy } from './actions';

export class PluginBlockTemplateServer extends Plugin {
  beforeLoad() {
    this.app.acl.allow('blockTemplates', '*', 'loggedIn');

    this.app.resourceManager.registerActionHandler('blockTemplates:destroy', destroy);
  }

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginBlockTemplateServer;
