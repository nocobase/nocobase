import React from 'react';
import { Action, PluginManager, PluginManagerProvider, SchemaComponentProvider } from '@nocobase/client';
import * as plugins from './plugins';

export default () => {
  return (
    <SchemaComponentProvider components={{ Action }}>
      <PluginManagerProvider components={plugins}>
        <PluginManager.Toolbar
          items={[
            {
              component: 'Plugin1.ToolbarItem',
              pin: true,
            },
            {
              component: 'Plugin2.ToolbarItem',
              pin: true,
            },
            {
              component: 'Plugin3.ToolbarItem',
              pin: true,
            },
            {
              component: 'Plugin4.ToolbarItem',
            },
            {
              component: 'Plugin5.ToolbarItem',
            },
          ]}
        />
      </PluginManagerProvider>
    </SchemaComponentProvider>
  );
};
