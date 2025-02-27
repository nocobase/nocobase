/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';
import { destroy, link, saveSchema } from './actions';
import { templateDataMiddleware } from './middlewares/templateData';

export class PluginBlockTemplateServer extends Plugin {
  beforeLoad() {
    this.app.acl.allow('blockTemplates', '*', 'loggedIn');
    this.app.resourceManager.registerActionHandler('blockTemplates:destroy', destroy);
    this.app.resourceManager.registerActionHandler('blockTemplates:link', link);
    this.app.resourceManager.registerActionHandler('blockTemplates:saveSchema', saveSchema);
    this.app.resourceManager.use(templateDataMiddleware);
  }

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginBlockTemplateServer;
