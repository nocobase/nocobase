import React, { useContext } from 'react';
import { RouteSwitchContext } from '../route-switch';

export const WorkflowRouteProvider = (props) => {
  const { routes, ...others } = useContext(RouteSwitchContext);
  routes[1].routes.unshift({
    type: 'route',
    path: '/admin/plugins/workflows/:id',
    component: 'WorkflowPage',
  });
  return <RouteSwitchContext.Provider value={{ ...others, routes }}>{props.children}</RouteSwitchContext.Provider>;
};
