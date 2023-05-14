import React, { useContext } from 'react';

import { PluginManagerContext, SettingsCenterProvider } from '@nocobase/client';

import { NAMESPACE } from './locale';

import { LocalizationManagementProviders } from './LocalizationManagementProviders';

export default function (props) {
  const ctx = useContext(PluginManagerContext);
  return (
    <SettingsCenterProvider
      settings={{
        localizationManagement: {
          icon: 'ApiOutlined',
          title: `{{t("Localization Management", { ns: "${NAMESPACE}" })}}`,
          tabs: {
            providers: {
              title: `{{t("Localization Management", { ns: "${NAMESPACE}" })}}`,
              component: LocalizationManagementProviders,
            },
          },
        },
      }}
    >
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
}
