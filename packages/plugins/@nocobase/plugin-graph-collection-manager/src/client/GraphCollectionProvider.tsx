import { PluginManagerContext } from '@nocobase/client';
import React, { useContext } from 'react';

export const GraphCollectionProvider = React.memo((props) => {
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
});
GraphCollectionProvider.displayName = 'GraphCollectionProvider';
