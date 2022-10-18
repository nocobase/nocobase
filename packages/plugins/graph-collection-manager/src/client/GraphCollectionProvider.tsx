import { PluginManagerContext, RouteSwitchContext, SettingsCenterProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { i18n } from '@nocobase/client';
import { useTranslation } from 'react-i18next';
import { GraphCollectionPane, GraphCollectionShortcut } from './GraphCollectionShortcut';
import {zhCN,enUS,jaJP} from './locale'


export const GraphCollectionProvider = (props) => {
  const ctx = useContext(PluginManagerContext);
  const { routes, components, ...others } = useContext(RouteSwitchContext);
  i18n.addResources('en-US', 'graphPositions', enUS);
  i18n.addResources('ja-JP', 'graphPositions', jaJP);
  i18n.addResources('zh-CN', 'graphPositions', zhCN);
  const { t } = useTranslation('graphPositions');

  return (
    <SettingsCenterProvider
      settings={{
        graph: {
          icon: 'ClusterOutlined',
          title: t("Graph Collection"),
          tabs: {
            collections: {
              title: t("Graph Collection"),
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
