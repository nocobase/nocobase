/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Plugin, useApp, useCollectionDataSource, useVariables } from '@nocobase/client';
import WorkflowPlugin, { useNodeSavedConfig, WorkflowVariableTextArea } from '@nocobase/plugin-workflow/client';
import { LoadingOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect } from 'react';
import { Instruction } from '@nocobase/plugin-workflow/client';

export class PluginWorkflowRefreshClient extends Plugin {
  async afterAdd() {
    // await this.app.pm.add()
  }

  async beforeLoad() {}

  // You can get and modify the app instance here
  async load() {
    console.log(this.app);

    const workflow = this.app.pm.get('workflow') as WorkflowPlugin;
    workflow.registerInstruction('refresh', RefreshInstruction);
    // this.app.addComponents({})
    // this.app.addScopes({})
    // this.app.addProvider()
    // this.app.addProviders()
    // this.app.router.add()

    this.app.addProvider(PluginWorkflowRefreshProvider, { name: 'nocobase' });
  }
}

export default PluginWorkflowRefreshClient;

class RefreshInstruction extends Instruction {
  title = `{{t("Refresh")}}`;
  type = 'refresh';
  group = 'collection';
  description = `refresh`;
  icon = (<LoadingOutlined />);
  fieldset = {
    uri: {
      type: 'string',
      title: `Adres URI lub URL`,
      'x-decorator': 'FormItem',
      'x-decorator-props': {},
      'x-component': 'WorkflowVariableTextArea',
      'x-component-props': {
        placeholder: '/',
      },
      required: true,
      default: '/',
    },
  };
  scope = {
    useNodeSavedConfig,
    useCollectionDataSource,
  };
  components = {
    // ArrayItems,
    // FilterDynamicComponent,
    // SchemaComponentContext,
    // WorkflowVariableInput,
    // RadioWithTooltip,
    WorkflowVariableTextArea,
  };
  useVariables = useVariables;
  // useInitializers(node): SchemaInitializerItemType | null {
  //   if (!node.config.collection || node.config.multiple) {
  //     return null;
  //   }

  //   return {
  //     name: node.title ?? `#${node.id}`,
  //     type: 'item',
  //     title: node.title ?? `#${node.id}`,
  //     Component: CollectionBlockInitializer,
  //     collection: node.config.collection,
  //     dataPath: `$jobsMapByNodeKey.${node.key}`,
  //   };
  // }
}

const PluginWorkflowRefreshProvider = ({ name, children }) => {
  const app = useApp();

  const handleRefresh = useCallback((event: CustomEvent) => {
    const { uri } = event.detail;

    if (window?.location?.href == uri || window?.location?.pathname == uri) {
      window.location.reload();
    }
  }, []);

  useEffect(() => {
    app.eventBus.addEventListener('ws:message:refresh', handleRefresh);

    return () => {
      app.eventBus.removeEventListener('ws:message:refresh', handleRefresh);
    };
  }, [app]);

  return children;
};
