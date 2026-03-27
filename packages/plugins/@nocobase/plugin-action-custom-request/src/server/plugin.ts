/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Logger, LoggerOptions } from '@nocobase/logger';
import { InstallOptions, Plugin } from '@nocobase/server';
import { listByCurrentRole } from './actions/listByCurrentRole';
import { send } from './actions/send';

export class PluginActionCustomRequestServer extends Plugin {
  logger: Logger;

  afterAdd() {}

  beforeLoad() {
    this.logger = this.getLogger();
  }

  getLogger(): Logger {
    const logger = this.createLogger({
      dirname: 'custom-request',
      filename: '%DATE%.log',
    } as LoggerOptions);

    return logger;
  }

  async load() {
    this.app.resourceManager.define({
      name: 'customRequests',
      actions: {
        send: send.bind(this),
        listByCurrentRole,
      },
    });

    this.app.acl.registerSnippet({
      name: `ui.${this.name}`,
      actions: ['customRequests:*', 'roles:list'],
    });

    this.app.acl.allow('customRequests', ['send', 'listByCurrentRole'], 'loggedIn');
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginActionCustomRequestServer;
