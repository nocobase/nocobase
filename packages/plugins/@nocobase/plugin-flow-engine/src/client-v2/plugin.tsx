/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type Application, Plugin } from '@nocobase/client-v2';
import { installRunJSWorkspaceClientV2 } from '@nocobase/runjs-workspace/client-v2';

export class PluginFlowEngineClientV2 extends Plugin<Record<string, never>, Application> {
  private runJSWorkspaceDisposer?: () => void;

  async beforeLoad() {
    this.disposeRunJSWorkspaceClient();
  }

  async load() {
    this.disposeRunJSWorkspaceClient();
    this.runJSWorkspaceDisposer = installRunJSWorkspaceClientV2(this.app.apiClient);
  }

  dispose() {
    this.disposeRunJSWorkspaceClient();
  }

  private disposeRunJSWorkspaceClient(): void {
    this.runJSWorkspaceDisposer?.();
    this.runJSWorkspaceDisposer = undefined;
  }
}

export default PluginFlowEngineClientV2;
