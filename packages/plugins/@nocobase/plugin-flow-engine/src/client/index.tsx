/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import _ from 'lodash';

import { installRunJSRuntimeLegacyClient } from './runjs';

let activeFlowEngineLegacyClientInstance: PluginFlowEngineClient | null = null;

export class PluginFlowEngineClient extends Plugin {
  private runJSRuntimeDisposer?: () => void;

  async afterAdd() {}

  async beforeLoad() {
    this.activateRunJSRuntimeClient();
  }

  async load() {
    this.activateRunJSRuntimeClient();
  }

  dispose() {
    this.disposeRunJSRuntimeClient();
    if (activeFlowEngineLegacyClientInstance === this) {
      activeFlowEngineLegacyClientInstance = null;
    }
  }

  private disposeRunJSRuntimeClient(): void {
    this.runJSRuntimeDisposer?.();
    this.runJSRuntimeDisposer = undefined;
  }

  private installRunJSRuntimeClient(): void {
    this.runJSRuntimeDisposer ||= installRunJSRuntimeLegacyClient();
  }

  private activateRunJSRuntimeClient(): void {
    if (activeFlowEngineLegacyClientInstance !== this) {
      activeFlowEngineLegacyClientInstance?.dispose();
    }
    this.installRunJSRuntimeClient();
    activeFlowEngineLegacyClientInstance = this;
  }
}

export default PluginFlowEngineClient;
