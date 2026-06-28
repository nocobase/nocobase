/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, type Application } from '@nocobase/client-v2';
import { PluginWorkflowClientV2 } from '@nocobase/plugin-workflow/client-v2';

import { registerWorkflowCcModelLoaders } from './models/registerModelLoaders';
import CCInstruction from './nodes/cc';
import { registerWorkflowCcCollections } from './utils/registerWorkflowCcCollections';

type WorkflowClientLike = {
  registerInstruction?: (type: string, instruction: unknown) => void;
};

export class PluginWorkflowCCClientV2 extends Plugin<Record<string, never>, Application> {
  async load() {
    this.registerCollections();
    this.registerModelLoaders();
    this.registerWorkflowExtensions();
  }

  private registerCollections() {
    registerWorkflowCcCollections(this.flowEngine);
  }

  private registerModelLoaders() {
    registerWorkflowCcModelLoaders(this.flowEngine);
  }

  private registerWorkflowExtensions() {
    const workflow =
      (this.app.pm.get(PluginWorkflowClientV2) as WorkflowClientLike | undefined) ??
      (this.app.pm.get('workflow') as WorkflowClientLike | undefined);

    workflow?.registerInstruction?.('cc', CCInstruction);
  }
}

export default PluginWorkflowCCClientV2;
