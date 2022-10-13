import { PluginManagerContext, RouteSwitchContext, SettingsCenterProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { GraphCollectionPane, GraphCollectionShortcut } from './GraphCollectionShortcut';

export const GraphCollectionProvider = (props) => {
  const ctx = useContext(PluginManagerContext);
  const { routes, components, ...others } = useContext(RouteSwitchContext);

  return (
    <SettingsCenterProvider
      settings={{
        graph: {
          icon: 'ClusterOutlined',
          title: '{{t("Graph Collection")}}',
          tabs: {
            collections: {
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
        <RouteSwitchContext.Provider value={{ components: { ...components }, ...others, routes }}>
          {props.children}
        </RouteSwitchContext.Provider>
      </PluginManagerContext.Provider>
    </SettingsCenterProvider>
  );
};
