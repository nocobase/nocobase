import { PluginManagerContext, RouteSwitchContext, SettingsCenterProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { GraphCollectionPage } from './GraphCollectionPage';
import { GraphCollectionPane, GraphCollectionShortcut } from './GraphCollectionShortcut';







export const GraphCollectionProvider = (props) => {
  const ctx = useContext(PluginManagerContext);
  const { routes, components, ...others } = useContext(RouteSwitchContext);
  routes[1].routes.unshift({
    type: 'route',
    path: '/admin/graph/collection/:id',
    component: 'GraphCollectionPage',
  });
  return (
    <SettingsCenterProvider
      settings={{
        'graph': {
          icon: 'ClusterOutlined',
          title: '{{t("Graph Collection")}}',
          tabs: {
            'collections': {
              title: '{{t("Graph Collection")}}',
              component: GraphCollectionPane,
            },
          },
        },
      }}
    >
      <PluginManagerContext.Provider
        value={{
          components: {
            ...ctx?.components,
            GraphCollectionShortcut,
          },
        }}
      >
        <RouteSwitchContext.Provider value={{ components: { ...components, GraphCollectionPage }, ...others, routes }}>
          {props.children}
        </RouteSwitchContext.Provider>
      </PluginManagerContext.Provider>
    </SettingsCenterProvider>
  );
};
