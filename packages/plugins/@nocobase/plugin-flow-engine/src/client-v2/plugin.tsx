/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { type Application, Plugin } from '@nocobase/client-v2';

import { installRunJSRuntimeClientV2 } from './runjs';

let activeFlowEngineClientV2Instance: PluginFlowEngineClientV2 | null = null;

export class PluginFlowEngineClientV2 extends Plugin<Record<string, never>, Application> {
  private runJSRuntimeDisposer?: () => void;

  async beforeLoad() {
    this.activateRunJSRuntimeClient();
  }

  async load() {
    this.activateRunJSRuntimeClient();
  }

  dispose() {
    this.disposeRunJSRuntimeClient();
    if (activeFlowEngineClientV2Instance === this) {
      activeFlowEngineClientV2Instance = null;
    }
  }

  private disposeRunJSRuntimeClient(): void {
    this.runJSRuntimeDisposer?.();
    this.runJSRuntimeDisposer = undefined;
  }

  private installRunJSRuntimeClient(): void {
    this.runJSRuntimeDisposer ||= installRunJSRuntimeClientV2();
  }

  private activateRunJSRuntimeClient(): void {
    if (activeFlowEngineClientV2Instance !== this) {
      activeFlowEngineClientV2Instance?.dispose();
    }
    this.installRunJSRuntimeClient();
    activeFlowEngineClientV2Instance = this;
  }
}

export default PluginFlowEngineClientV2;
