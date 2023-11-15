import React, { FC, useContext } from 'react';

import { PluginManagerContext } from '@nocobase/client';
export { default as verificationProviderTypes } from './providerTypes';

export const VerificationProvider: FC = (props) => {
  const ctx = useContext(PluginManagerContext);
  return (
    <PluginManagerContext.Provider
      value={{
        components: {
          ...ctx?.components,
        },
      }}
    >
      {props.children}
    </PluginManagerContext.Provider>
  );
};
