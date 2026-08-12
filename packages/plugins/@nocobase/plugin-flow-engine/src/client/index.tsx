/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client';
import { installRunJSWorkspaceRuntimeLegacyClient } from '@nocobase/runjs/workspace/client';
import _ from 'lodash';

export class PluginFlowEngineClient extends Plugin {
  private runJSRuntimeDisposer?: () => void;

  async afterAdd() {}

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
    this.runJSRuntimeDisposer ||= installRunJSWorkspaceRuntimeLegacyClient();
  }
}

export default PluginFlowEngineClient;
