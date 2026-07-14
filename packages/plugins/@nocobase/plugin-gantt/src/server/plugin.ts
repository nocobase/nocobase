/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { PluginFlowEngineServer } from '@nocobase/plugin-flow-engine/server';
import { InstallOptions, Plugin } from '@nocobase/server';
import { ganttFlowSurfaceCapabilitiesProvider } from './flow-surface-provider';

export class PluginGanttServer extends Plugin {
  afterAdd() {}

  beforeLoad() {}

  async load() {
    const flowEnginePlugin = (this.app.pm.get('@nocobase/plugin-flow-engine') || this.app.pm.get('flow-engine')) as
      | PluginFlowEngineServer
      | undefined;
    flowEnginePlugin?.flowSurfaceCapabilityProviders.registerProvider(ganttFlowSurfaceCapabilitiesProvider);
  }

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {
    const flowEnginePlugin = (this.app.pm.get('@nocobase/plugin-flow-engine') || this.app.pm.get('flow-engine')) as
      | PluginFlowEngineServer
      | undefined;
    flowEnginePlugin?.flowSurfaceCapabilityProviders.unregisterProvider(
      ganttFlowSurfaceCapabilitiesProvider.ownerPlugin,
    );
  }

  async remove() {
    await this.afterDisable();
  }
}

export default PluginGanttServer;
