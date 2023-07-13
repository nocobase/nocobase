import { PluginManagerContext, SettingsCenterContext, SettingsCenterProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { GraphCollectionPane } from './GraphCollectionShortcut';
import { useGCMTranslation } from './utils';

export const GraphCollectionProvider = React.memo((props) => {
  const ctx = useContext(PluginManagerContext);
  // i18n.addResources('en-US', 'graphPositions', enUS);
  // i18n.addResources('ja-JP', 'graphPositions', jaJP);
  // i18n.addResources('zh-CN', 'graphPositions', zhCN);
  const { t } = useGCMTranslation();
  const items = useContext(SettingsCenterContext);

  items['collection-manager']['tabs']['graph'] = {
    title: t('Graphical interface'),
    component: GraphCollectionPane,
  };

  return (
    <SettingsCenterProvider settings={items}>
      <PluginManagerContext.Provider
        value={{
          components: {
            ...ctx?.components,
          },
        }}
      >
        {props.children}
      </PluginManagerContext.Provider>
    </SettingsCenterProvider>
  );
});
GraphCollectionProvider.displayName = 'GraphCollectionProvider';
