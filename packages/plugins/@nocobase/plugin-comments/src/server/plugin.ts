/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import type { FlowSchemaContribution } from '@nocobase/flow-engine';
import { Plugin } from '@nocobase/server';
import { flowSchemaContribution } from './flow-schema-contributions';

export class PluginCommentServer extends Plugin {
  async afterAdd() {}

  getFlowSchemaContributions(): FlowSchemaContribution {
    return flowSchemaContribution;
  }

  async beforeLoad() {}

  async load() {}

  async install() {}

  async afterEnable() {}

  async afterDisable() {}

  async remove() {}
}

export default PluginCommentServer;
