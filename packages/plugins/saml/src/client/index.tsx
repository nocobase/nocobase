import React, { useContext } from 'react';
import { PluginManagerContext, SettingsCenterProvider } from '@nocobase/client';
import { SigninPageExtensionProvider } from '@nocobase/client';
import { useSamlTranslation } from './locale';
import { SAMLList } from './SAMLList';
import { SAMLPanel } from './SAMLPanel';

export default function (props) {
  const ctx = useContext(PluginManagerContext);
  const { t } = useSamlTranslation();

  return (
    <SigninPageExtensionProvider component={SAMLList}>
      <SettingsCenterProvider
        settings={{
          'saml-manager': {
            title: t('SAML manager'),
            icon: 'FileOutlined',
            tabs: {
              storages: {
                title: t('SAML Providers'),
                component: SAMLPanel,
              },
            },
          },
        }}
        scope={{
          t,
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
