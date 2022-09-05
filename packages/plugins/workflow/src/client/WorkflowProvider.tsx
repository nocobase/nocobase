import { PluginManagerContext, RouteSwitchContext, SettingsCenterProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { WorkflowPage } from './WorkflowPage';
import { WorkflowPane, WorkflowShortcut } from './WorkflowShortcut';

export const WorkflowProvider = (props) => {
  const ctx = useContext(PluginManagerContext);
  const { routes, components, ...others } = useContext(RouteSwitchContext);
  routes[1].routes.unshift({
    type: 'route',
    path: '/admin/plugins/workflows/:id',
    component: 'WorkflowPage',
  });
  return (
    <SettingsCenterProvider
      settings={{
        workflow: {
          title: 'Workflow',
          tabs: {
            workflows: {
              title: 'Workflow',
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
        <RouteSwitchContext.Provider value={{ components: { ...components, WorkflowPage }, ...others, routes }}>
          {props.children}
        </RouteSwitchContext.Provider>
      </PluginManagerContext.Provider>
    </SettingsCenterProvider>
  );
};
