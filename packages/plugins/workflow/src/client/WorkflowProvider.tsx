import React, { useContext } from 'react';
import { PluginManagerContext, RouteSwitchContext } from '@nocobase/client';
import { WorkflowPage } from './WorkflowPage';
import { WorkflowShortcut } from './WorkflowShortcut';

export const WorkflowProvider = (props) => {
  const ctx = useContext(PluginManagerContext);
  const { routes, components, ...others } = useContext(RouteSwitchContext);
  routes[1].routes.unshift({
    type: 'route',
    path: '/admin/plugins/workflows/:id',
    component: 'WorkflowPage',
  });
  return (
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
  );
};
