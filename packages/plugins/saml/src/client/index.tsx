import { PluginManagerContext, SettingsCenterProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { SAMLPanel } from './SAMLPanel';

export default function (props) {
  const ctx = useContext(PluginManagerContext);
  return (
    <SettingsCenterProvider
      settings={{
        'saml-manager': {
          title: '{{t("SAML manager")}}',
          icon: 'FileOutlined',
          tabs: {
            storages: {
              title: '{{t("SAML Providers")}}',
              component: SAMLPanel,
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
