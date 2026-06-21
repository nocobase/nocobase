/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import {
  ButtonEditor,
  ExtendCollectionsProvider,
  Plugin,
  RemoveButton,
  SchemaSettings,
  useSchemaToolbar,
} from '@nocobase/client';
import PluginWorkflowClient from '@nocobase/plugin-workflow/client';
import CCInstruction from './instruction';
import { addBlockButton } from './instruction/SchemaConfig';
import ccCollection from '../common/collections/workflowCcTasks';
import { TASK_TYPE_CC } from '../common/constants';
import { ccTodo } from './tasks';

// FlowModel imports
import { CCChildPageModel } from './models/CCChildPageModel';
import { CCChildPageTabModel } from './models/CCChildPageTabModel';
import { CCBlockGridModel } from './models/CCBlockGridModel';
import { CCTriggerBlockGridModel } from './models/CCTriggerBlockGridModel';
import { CCTaskCardDetailsModel } from './models/CCTaskCardDetailsModel';
import { CCTaskCardGridModel } from './models/CCTaskCardGridModel';
import { CCTaskCardDetailsItemModel } from './models/CCTaskCardDetailsItemModel';
import { CCTaskCardDetailsAssociationFieldGroupModel } from './models/CCTaskCardDetailsAssociationFieldGroupModel';

function WorkflowCCProvider(props) {
  return <ExtendCollectionsProvider collections={[ccCollection]}>{props.children}</ExtendCollectionsProvider>;
}

export class PluginWorkflowCCClient extends Plugin {
  // You can get and modify the app instance here
  async load() {
    this.app.addProvider(WorkflowCCProvider);

    const workflow = this.app.pm.get(PluginWorkflowClient);
    workflow.registerInstruction('cc', CCInstruction);
    workflow.registerTaskType(TASK_TYPE_CC, ccTodo);

    // Register FlowModels
    this.flowEngine.registerModels({
      // User interface 相关
      CCChildPageModel,
      CCChildPageTabModel,
      CCBlockGridModel,
      CCTriggerBlockGridModel,
      // Task card 相关
      CCTaskCardDetailsModel,
      CCTaskCardGridModel,
      CCTaskCardDetailsItemModel,
      CCTaskCardDetailsAssociationFieldGroupModel,
    });

    this.app.schemaInitializerManager.add(addBlockButton);
    // this.app.schemaInitializerManager.add(addActionButton);
    this.app.schemaSettingsManager.add(
      new SchemaSettings({
        name: 'actionSettings:workflow:cc:read',
        items: [
          {
            name: 'editButton',
            Component: ButtonEditor,
            useComponentProps() {
              const { buttonEditorProps } = useSchemaToolbar();
              return buttonEditorProps;
            },
          },
          {
            name: 'delete',
            sort: 100,
            Component: RemoveButton as any,
            useComponentProps() {
              const { removeButtonProps } = useSchemaToolbar();
              return removeButtonProps;
            },
          },
        ],
      }),
    );

    workflow.registerCollectionsToDataSource([ccCollection]);
  }
}

export default PluginWorkflowCCClient;
