import { PluginManagerContext, SettingsCenterProvider, SigninPageExtensionProvider } from '@nocobase/client';
import React, { useContext } from 'react';
import { useOidcTranslation } from './locale';
import { OIDCList } from './OIDCList';
import { OIDCPanel } from './OIDCPanel';

export default function (props) {
  const { t } = useOidcTranslation();
  const ctx = useContext(PluginManagerContext);
  return (
    <SigninPageExtensionProvider component={<OIDCList />}>
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
    </SigninPageExtensionProvider>
  );
}
