/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { Plugin } from '@nocobase/client';
import WorkflowPlugin from '@nocobase/plugin-workflow/client';

import {
  RecordTriggerWorkflowActionModel,
  FormTriggerWorkflowActionModel,
  CollectionTriggerWorkflowActionModel,
} from './flows';
import CustomActionTrigger from './CustomActionTrigger';
import {
  useCollectionTriggerWorkflowCustomActionProps,
  useFormWorkflowCustomActionProps,
  useGlobalTriggerWorkflowCustomActionProps,
  useRecordWorkflowCustomTriggerActionProps,
} from './hooks';
import {
  customizeCollectionTriggerWorkflowActionSettings,
  customizeGlobalTriggerWorkflowActionSettings,
  customizeSubmitToWorkflowActionSettings,
} from './settings';
import {
  DataBlockTriggerWorkflowActionSchemaInitializerItem,
  globalTriggerWorkflowActionInitializer,
  recordTriggerWorkflowActionInitializer,
  recordTriggerWorkflowActionLinkInitializer,
  submitToWorkflowActionInitializer,
  WorkbenchTriggerWorkflowActionSchemaInitializerItem,
} from './initializers';
import { GlobalTriggerWorkflowAction } from './components';
import { EVENT_TYPE } from '../common/constants';

class CustomActionTigger extends Plugin {
  async beforeLoad() {
    this.app.eventBus.addEventListener('plugin:kanban:loaded', () => {
      this.app.schemaInitializerManager
        .get('kanban:configureActions')
        .add('customize.triggerWorkflow', globalTriggerWorkflowActionInitializer);
    });

    this.app.eventBus.addEventListener('plugin:calendar:loaded', () => {
      this.app.schemaInitializerManager
        .get('calendar:configureActions')
        .add('customize.triggerWorkflow', globalTriggerWorkflowActionInitializer);
    });

    this.app.eventBus.addEventListener('plugin:gantt:loaded', () => {
      this.app.schemaInitializerManager
        .get('gantt:configureActions')
        .add('customize.triggerWorkflow', globalTriggerWorkflowActionInitializer);

      this.app.schemaInitializerManager.addItem('gantt:configureActions', 'customize.triggerWorkflow', {
        Component: DataBlockTriggerWorkflowActionSchemaInitializerItem,
      });
    });

    this.app.eventBus.addEventListener('plugin:block-workbench:loaded', () => {
      this.app.schemaInitializerManager.addItem('workbench:configureActions', 'customize.triggerWorkflow', {
        Component: WorkbenchTriggerWorkflowActionSchemaInitializerItem,
      });
    });
  }

  async load() {
    const workflow = this.app.pm.get('workflow') as WorkflowPlugin;
    workflow.registerTrigger(EVENT_TYPE, CustomActionTrigger);

    this.app.addScopes({
      useFormWorkflowCustomActionProps,
      useRecordWorkflowCustomTriggerActionProps,
      useCollectionTriggerWorkflowCustomActionProps,
      useGlobalTriggerWorkflowCustomActionProps,
    });

    this.app.addComponents({
      GlobalTriggerWorkflowAction,
    });

    this.app.schemaSettingsManager.add(customizeSubmitToWorkflowActionSettings);
    this.app.schemaSettingsManager.add(customizeCollectionTriggerWorkflowActionSettings);
    this.app.schemaSettingsManager.add(customizeGlobalTriggerWorkflowActionSettings);

    this.app.schemaInitializerManager
      .get('FormActionInitializers')
      .add('customize.triggerWorkflow', submitToWorkflowActionInitializer);

    this.app.schemaInitializerManager
      .get('createForm:configureActions')
      .add('customize.triggerWorkflow', submitToWorkflowActionInitializer);

    this.app.schemaInitializerManager
      .get('editForm:configureActions')
      .add('customize.triggerWorkflow', submitToWorkflowActionInitializer);

    this.app.schemaInitializerManager
      .get('detailsWithPaging:configureActions')
      .add('customize.triggerWorkflow', recordTriggerWorkflowActionInitializer);

    this.app.schemaInitializerManager
      .get('details:configureActions')
      .add('customize.triggerWorkflow', recordTriggerWorkflowActionInitializer);

    this.app.schemaInitializerManager
      .get('table:configureItemActions')
      .add('customize.triggerWorkflow', recordTriggerWorkflowActionLinkInitializer);

    this.app.schemaInitializerManager
      .get('gridCard:configureItemActions')
      .add('customize.triggerWorkflow', recordTriggerWorkflowActionLinkInitializer);

    this.app.schemaInitializerManager
      .get('list:configureItemActions')
      .add('customize.triggerWorkflow', recordTriggerWorkflowActionLinkInitializer);

    // global
    // this.app.schemaInitializerManager
    //   .get('table:configureActions')
    //   .add('customize.triggerWorkflow', globalTriggerWorkflowActionInitializer);

    this.app.schemaInitializerManager
      .get('list:configureActions')
      .add('customize.triggerWorkflow', globalTriggerWorkflowActionInitializer);

    this.app.schemaInitializerManager
      .get('gridCard:configureActions')
      .add('customize.triggerWorkflow', globalTriggerWorkflowActionInitializer);

    // this.app.schemaInitializerManager
    //   .get('workbench:configureActions')
    //   .add('customize.triggerWorkflow', workbenchTriggerWorkflowActionInitializer);

    this.app.schemaInitializerManager.addItem('table:configureActions', 'customize.triggerWorkflow', {
      Component: DataBlockTriggerWorkflowActionSchemaInitializerItem,
    });

    this.flowEngine.registerModels({
      FormTriggerWorkflowActionModel,
      RecordTriggerWorkflowActionModel,
      CollectionTriggerWorkflowActionModel,
      // CollectionGlobalTriggerWorkflowActionModel,
    });
  }
}

export default CustomActionTigger;
