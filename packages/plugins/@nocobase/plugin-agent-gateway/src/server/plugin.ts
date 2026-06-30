/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { resolve } from 'path';

import { Plugin } from '@nocobase/server';

import { registerNodeLifecycleRoutes } from './actions/nodeLifecycle';
import { registerRunLifecycleRoutes } from './actions/runLifecycle';
import { registerAgentGatewayAcl } from './security/permissions';

export class PluginAgentGatewayServer extends Plugin {
  async afterAdd() {}

  async beforeLoad() {
    this.db.addMigrations({
      namespace: this.name,
      directory: resolve(__dirname, './migrations'),
      context: {
        plugin: this,
      },
    });

    registerAgentGatewayAcl(this.app.acl);
  }

  async load() {
    registerNodeLifecycleRoutes(this);
    registerRunLifecycleRoutes(this);
  }

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginAgentGatewayServer;
