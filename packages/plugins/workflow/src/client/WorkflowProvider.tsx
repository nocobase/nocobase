import {
  CollectionManagerContext,
  PluginManagerContext,
  RouteSwitchContext,
  SchemaComponent,
  SchemaComponentOptions,
  SettingsCenterProvider,
  useCollectionDataSource
} from '@nocobase/client';
import { Card } from 'antd';
import React, { useContext } from 'react';

import { ExecutionLink } from './ExecutionLink';
import { ExecutionPage } from './ExecutionPage';
import { ExecutionResourceProvider } from './ExecutionResourceProvider';
import { WorkflowLink } from './WorkflowLink';
import { WorkflowPage } from './WorkflowPage';
import { DynamicExpression } from './components/DynamicExpression';
import OpenDrawer from './components/OpenDrawer';
import expressionField from './interfaces/expression';
import { lang } from './locale';
import { instructions } from './nodes';
import { WorkflowTodo } from './nodes/manual/WorkflowTodo';
import { WorkflowTodoBlockInitializer } from './nodes/manual/WorkflowTodoBlockInitializer';
import { workflowSchema } from './schemas/workflows';
import { triggers } from './triggers';

// registerField(expressionField.group, 'expression', expressionField);

export const WorkflowContext = React.createContext({});

export function useWorkflowContext() {
  return useContext(WorkflowContext);
}

function WorkflowPane() {
  return (
    <Card bordered={false}>
      <SchemaComponent
        schema={workflowSchema}
        components={{
          WorkflowLink,
          ExecutionResourceProvider,
          ExecutionLink,
          OpenDrawer,
        }}
      />
    </Card>
  );
}

export const WorkflowProvider = (props) => {
  const pmCtx = useContext(PluginManagerContext);
  const cmCtx = useContext(CollectionManagerContext);
  const { routes, components, ...others } = useContext(RouteSwitchContext);
  routes[1].routes.unshift(
    {
      type: 'route',
      path: '/admin/settings/workflow/workflows/:id',
      component: 'WorkflowPage',
    },
    {
      type: 'route',
      path: '/admin/settings/workflow/executions/:id',
      component: 'ExecutionPage',
    },
  );
  return (
    <SettingsCenterProvider
      settings={{
        workflow: {
          icon: 'PartitionOutlined',
          // title: `{{t("Workflow", { ns: "${NAMESPACE}" })}}`,
          title: lang('Workflow'),
          tabs: {
            workflows: {
              isBookmark: true,
              title: lang('Workflow'),
              component: WorkflowPane,
            },
          },
        },
      }}
    >
      <PluginManagerContext.Provider
        value={{
          components: {
            ...pmCtx?.components,
          },
        }}
      >
        <RouteSwitchContext.Provider
          value={{ components: { ...components, WorkflowPage, ExecutionPage }, ...others, routes }}
        >
          <SchemaComponentOptions
            components={{
              WorkflowTodo,
              WorkflowTodoBlockInitializer,
              DynamicExpression,
            }}
            scope={{
              useCollectionDataSource,
            }}
          >
            <CollectionManagerContext.Provider
              value={{
                ...cmCtx,
                interfaces: {
                  ...cmCtx.interfaces,
                  expression: expressionField,
                },
              }}
            >
              <WorkflowContext.Provider value={{ triggers, instructions }}>{props.children}</WorkflowContext.Provider>
            </CollectionManagerContext.Provider>
          </SchemaComponentOptions>
        </RouteSwitchContext.Provider>
      </PluginManagerContext.Provider>
    </SettingsCenterProvider>
  );
};
