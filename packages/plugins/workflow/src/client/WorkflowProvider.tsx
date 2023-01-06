import React, { useContext } from 'react';
import { Card } from 'antd';
import { PluginManagerContext, RouteSwitchContext, SchemaComponent, SchemaComponentOptions, SettingsCenterProvider } from '@nocobase/client';
import { WorkflowPage } from './WorkflowPage';
import { ExecutionPage } from './ExecutionPage';
import { triggers } from './triggers';
import { instructions } from './nodes';
import { lang } from './locale';
import { workflowSchema } from './schemas/workflows';
import { WorkflowLink } from './WorkflowLink';
import { ExecutionResourceProvider } from './ExecutionResourceProvider';
import { ExecutionLink } from './ExecutionLink';
import OpenDrawer from './components/OpenDrawer';
import { WorkflowTodo } from './nodes/manual/WorkflowTodo';
import { WorkflowTodoBlockInitializer } from './nodes/manual/WorkflowTodoBlockInitializer';

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
          OpenDrawer
        }}
      />
    </Card>
  );
};

export const WorkflowProvider = (props) => {
  const ctx = useContext(PluginManagerContext);
  const { routes, components, ...others } = useContext(RouteSwitchContext);
  routes[1].routes.unshift({
    type: 'route',
    path: '/admin/settings/workflow/workflows/:id',
    component: 'WorkflowPage',
  }, {
    type: 'route',
    path: '/admin/settings/workflow/executions/:id',
    component: 'ExecutionPage',
  });
  return (
    <SettingsCenterProvider
      settings={{
        workflow: {
          icon: 'PartitionOutlined',
          // title: `{{t("Workflow", { ns: "${NAMESPACE}" })}}`,
          title: lang('Workflow'),
          tabs: {
            workflows: {
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
            ...ctx?.components,
            // WorkflowShortcut,
          },
        }}
      >
        <RouteSwitchContext.Provider value={{ components: { ...components, WorkflowPage, ExecutionPage }, ...others, routes }}>
          <SchemaComponentOptions components={{ WorkflowTodo, WorkflowTodoBlockInitializer }}>
            <WorkflowContext.Provider value={{ triggers, instructions }}>
              {props.children}
            </WorkflowContext.Provider>
          </SchemaComponentOptions>
        </RouteSwitchContext.Provider>
      </PluginManagerContext.Provider>
    </SettingsCenterProvider>
  );
};
