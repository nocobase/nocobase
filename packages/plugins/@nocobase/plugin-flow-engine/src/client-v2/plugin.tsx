/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type Application, Plugin } from '@nocobase/client-v2';
import { installRunJSWorkspaceRuntimeClientV2 } from '@nocobase/runjs/workspace/client-v2';

export class PluginFlowEngineClientV2 extends Plugin<Record<string, never>, Application> {
  private runJSRuntimeDisposer?: () => void;

  async beforeLoad() {
    this.disposeRunJSRuntimeClient();
    this.installRunJSRuntimeClient();
  }

  async load() {
    this.installRunJSRuntimeClient();
  }

  dispose() {
    this.disposeRunJSRuntimeClient();
  }

  private disposeRunJSRuntimeClient(): void {
    this.runJSRuntimeDisposer?.();
    this.runJSRuntimeDisposer = undefined;
  }

  private installRunJSRuntimeClient(): void {
    this.runJSRuntimeDisposer ||= installRunJSWorkspaceRuntimeClientV2();
  }
}

export default PluginFlowEngineClientV2;
