/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/server';

export class PluginFlowDevtoolsServer extends Plugin {
  async load() {
    // Client-only diagnostics panel; reserve ACL snippet for visibility control.
    this.app.acl.registerSnippet({
      name: 'pm.flow-devtools',
      actions: [],
    });
  }
}

export default PluginFlowDevtoolsServer;
