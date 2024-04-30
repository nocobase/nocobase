/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { InstallOptions, Plugin } from '@nocobase/server';
import logger from './resourcer/logger';

export class PluginLoggerServer extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    this.app.resource(logger);
    this.app.acl.registerSnippet({
      name: `pm.${this.name}.logger`,
      actions: ['logger:*'],
    });
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginLoggerServer;
