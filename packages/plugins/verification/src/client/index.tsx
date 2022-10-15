import React, { useContext } from 'react';

import { PluginManagerContext } from '@nocobase/client';

import { Shortcut as VerificationShortcut } from './Shortcut';
export { default as verificationProviderTypes } from './providerTypes';

export default function(props) {
  const ctx = useContext(PluginManagerContext);
  return (
    <PluginManagerContext.Provider
      value={{
        components: {
          ...ctx?.components,
          VerificationShortcut,
        },
      }}
    >
      {props.children}
    </PluginManagerContext.Provider>
  );
};
