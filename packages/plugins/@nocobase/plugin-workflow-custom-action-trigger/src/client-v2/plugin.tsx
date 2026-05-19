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
import { CustomActionTrigger } from './triggers/CustomActionTrigger';

export class CustomActionTriggerPlugin extends Plugin {
  async load() {
    this.flowEngine.registerModelLoaders({
      FormTriggerWorkflowActionModel: {
        loader: () => import('./models/actions/TriggerWorkflowActionModels'),
      },
      RecordTriggerWorkflowActionModel: {
        loader: () => import('./models/actions/TriggerWorkflowActionModels'),
      },
      CollectionTriggerWorkflowActionModel: {
        loader: () => import('./models/actions/TriggerWorkflowActionModels'),
      },
      WorkbenchTriggerWorkflowActionModel: {
        loader: () => import('./models/actions/TriggerWorkflowActionModels'),
      },
    });

    const workflow = this.app.pm.get('workflow') as any;
    workflow?.registerTrigger?.(EVENT_TYPE, CustomActionTrigger);

    const registerActionGroups = async () => {
      const { registerTriggerWorkflowActionGroups } = await import('./models/actions/TriggerWorkflowActionModels');
      registerTriggerWorkflowActionGroups(this.flowEngine);
    };

    await registerActionGroups();
    this.app.eventBus.addEventListener('plugin:block-workbench:loaded', registerActionGroups);
  }
}

export default CustomActionTriggerPlugin;
