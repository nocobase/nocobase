import { PluginManagerContext, SettingsCenterProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { OIDCPanel } from './OIDCPanel';

export default function (props) {
  const ctx = useContext(PluginManagerContext);
  return (
    <SettingsCenterProvider
      settings={{
        'oidc-manager': {
          title: '{{t("OIDC manager")}}',
          icon: 'FileOutlined',
          tabs: {
            storages: {
              title: '{{t("OIDC storages")}}',
              component: OIDCPanel,
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
