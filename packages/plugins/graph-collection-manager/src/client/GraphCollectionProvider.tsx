import { PluginManagerContext, RouteSwitchContext, SettingsCenterContext, SettingsCenterProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { GraphCollectionPane, GraphCollectionShortcut } from './GraphCollectionShortcut';


export const GraphCollectionProvider = React.memo((props) => {
  const ctx = useContext(PluginManagerContext);
  const { routes, components, ...others } = useContext(RouteSwitchContext);
  // i18n.addResources('en-US', 'graphPositions', enUS);
  // i18n.addResources('ja-JP', 'graphPositions', jaJP);
  // i18n.addResources('zh-CN', 'graphPositions', zhCN);
  const { t } = useTranslation('graphPositions');
  const items = useContext(SettingsCenterContext);

  items['collection-manager']['tabs']['graph'] = {
    title: t("Graphical interface"),
    component: GraphCollectionPane,
  }

  return (
    <SettingsCenterProvider
      settings={items}
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
});
