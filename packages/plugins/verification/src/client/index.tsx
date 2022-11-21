import React, { useContext } from 'react';

import { PluginManagerContext, SettingsCenterProvider } from '@nocobase/client';

import { Shortcut as VerificationShortcut } from './Shortcut';
import { VerificationProviders } from './VerificationProviders';
export { default as verificationProviderTypes } from './providerTypes';

export default function(props) {
  const ctx = useContext(PluginManagerContext);
  return (
    <SettingsCenterProvider
      settings={{
        verification: {
          icon: 'CheckCircleOutlined',
          title: '{{t("Verification")}}',
          tabs: {
            providers: {
              title: '{{t("Verification providers")}}',
              component: VerificationProviders,
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
};


