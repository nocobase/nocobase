/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { installRunJSWorkspaceLegacyClient } from '@nocobase/runjs-workspace/client';
import _ from 'lodash';

export class PluginFlowEngineClient extends Plugin {
  private runJSWorkspaceDisposer?: () => void;

  async afterAdd() {}

  async beforeLoad() {
    this.disposeRunJSWorkspaceClient();
  }

  async load() {
    this.disposeRunJSWorkspaceClient();
    this.runJSWorkspaceDisposer = installRunJSWorkspaceLegacyClient(this.app.apiClient);
  }

  dispose() {
    this.disposeRunJSWorkspaceClient();
  }

  private disposeRunJSWorkspaceClient(): void {
    this.runJSWorkspaceDisposer?.();
    this.runJSWorkspaceDisposer = undefined;
  }
}

export default PluginFlowEngineClient;
