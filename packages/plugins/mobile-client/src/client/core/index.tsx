import { SchemaComponentOptions, SchemaInitializerProvider } from '@nocobase/client';
import React from 'react';
import { MBlockInitializers, MMenuBlockInitializer, MGrid, MMenu, MContainer, MTabBar } from './schema';

export const MobileCore: React.FC = (props) => {
  return (
    <SchemaInitializerProvider
      initializers={{
        MBlockInitializers,
      }}
    >
      <SchemaComponentOptions components={{ MMenuBlockInitializer, MContainer, MGrid, MMenu, MTabBar }}>
        {props.children}
      </SchemaComponentOptions>
    </SchemaInitializerProvider>
  );
};
