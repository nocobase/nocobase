/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSchemaContribution } from '@nocobase/flow-engine';
import { InstallOptions, Plugin } from '@nocobase/server';
import { flowSchemaContribution } from './flow-schema-contributions';

export class PluginActionBulkUpdateServer extends Plugin {
  getFlowSchemaContributions(): FlowSchemaContribution {
    return flowSchemaContribution;
  }

  afterAdd() {}

  beforeLoad() {}

  async load() {}

  async install(options?: InstallOptions) {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginActionBulkUpdateServer;
