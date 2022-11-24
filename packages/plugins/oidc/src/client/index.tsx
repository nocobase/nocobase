import { PluginManagerContext, SettingsCenterProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { useOidcTranslation } from './locale';
import { OIDCPanel } from './OIDCPanel';

export default function (props) {
  const { t } = useOidcTranslation();
  const ctx = useContext(PluginManagerContext);
  return (
    <SettingsCenterProvider
      settings={{
        'oidc-manager': {
          title: t('OIDC manager'),
          icon: 'FileOutlined',
          tabs: {
            storages: {
              title: t('OIDC Providers'),
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
