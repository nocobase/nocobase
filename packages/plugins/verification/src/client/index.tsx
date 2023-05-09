import React, { useContext } from 'react';

import { PluginManagerContext, SettingsCenterProvider } from '@nocobase/client';

import { NAMESPACE } from './locale';

import { VerificationProviders } from './VerificationProviders';

export { default as verificationProviderTypes } from './providerTypes';

export default function (props) {
  const ctx = useContext(PluginManagerContext);
  return (
    <SettingsCenterProvider
      settings={{
        verification: {
          icon: 'CheckCircleOutlined',
          title: `{{t("Verification", { ns: "${NAMESPACE}" })}}`,
          tabs: {
            providers: {
              title: `{{t("Verification providers", { ns: "${NAMESPACE}" })}}`,
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
}
