import React from 'react';
import { PluginManagerContext } from '@nocobase/client';
import { useContext } from 'react';
import { FileStorageShortcut } from './FileStorageShortcut';

export default function(props) {
  const ctx = useContext(PluginManagerContext);
  return (
    <PluginManagerContext.Provider
      value={{
        components: {
          ...ctx?.components,
          FileStorageShortcut,
        },
      }}
    >
      {props.children}
    </PluginManagerContext.Provider>
  );
};
