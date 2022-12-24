import React, { useContext } from 'react';
import { PluginManagerContext, RouteSwitchContext, SettingsCenterProvider } from '@nocobase/client';
import { WorkflowPage } from './WorkflowPage';
import { WorkflowPane, WorkflowShortcut } from './WorkflowShortcut';
import { ExecutionPage } from './ExecutionPage';
import { triggers } from './triggers';
import { instructions } from './nodes';
import { lang } from './locale';

export const WorkflowContext = React.createContext({});

export function useWorkflowContext() {
  return useContext(WorkflowContext);
}

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
          <WorkflowContext.Provider value={{ triggers, instructions }}>
            {props.children}
          </WorkflowContext.Provider>
        </RouteSwitchContext.Provider>
      </PluginManagerContext.Provider>
    </SettingsCenterProvider>
  );
};
