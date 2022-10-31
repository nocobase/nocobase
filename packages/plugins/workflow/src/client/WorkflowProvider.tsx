import { PluginManagerContext, RouteSwitchContext, SettingsCenterProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { WorkflowPage } from './WorkflowPage';
import { WorkflowPane, WorkflowShortcut } from './WorkflowShortcut';
import { ExecutionPage } from './ExecutionPage';

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
          title: '{{t("Workflow")}}',
          tabs: {
            workflows: {
              title: '{{t("Workflow")}}',
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
            WorkflowShortcut,
          },
        }}
      >
        <RouteSwitchContext.Provider value={{ components: { ...components, WorkflowPage, ExecutionPage }, ...others, routes }}>
          {props.children}
        </RouteSwitchContext.Provider>
      </PluginManagerContext.Provider>
    </SettingsCenterProvider>
  );
};
