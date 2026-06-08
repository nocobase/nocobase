/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin } from '@nocobase/client-v2';
import { EVENT_TYPE } from '../common/constants';
import {
  CollectionTriggerWorkflowActionModel,
  FormTriggerWorkflowActionModel,
  RecordTriggerWorkflowActionModel,
  registerTriggerWorkflowActionGroups,
  WorkbenchTriggerWorkflowActionModel,
} from './models/actions/TriggerWorkflowActionModels';
import { CustomActionTrigger } from './triggers/CustomActionTrigger';

type WorkflowPluginLike = {
  registerTrigger?: (eventType: typeof EVENT_TYPE, trigger: typeof CustomActionTrigger) => void;
};

export class CustomActionTriggerPlugin extends Plugin {
  private registerWorkbenchActionGroups = async () => {
    await this.flowEngine.getModelClassAsync('ActionPanelGroupActionModel');
    registerTriggerWorkflowActionGroups(this.flowEngine);
  };

  async beforeLoad() {
    this.app.eventBus.addEventListener('plugin:block-workbench:loaded', this.registerWorkbenchActionGroups);
  }

  async load() {
    this.flowEngine.registerModels({
      FormTriggerWorkflowActionModel,
      RecordTriggerWorkflowActionModel,
      CollectionTriggerWorkflowActionModel,
      WorkbenchTriggerWorkflowActionModel,
    });
    const workflow = this.app.pm.get('workflow') as WorkflowPluginLike | undefined;
    workflow?.registerTrigger?.(EVENT_TYPE, CustomActionTrigger);

    registerTriggerWorkflowActionGroups(this.flowEngine);
  }
}

export default CustomActionTriggerPlugin;
