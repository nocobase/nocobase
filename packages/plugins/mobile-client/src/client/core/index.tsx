import { SchemaComponentOptions, SchemaInitializerProvider } from '@nocobase/client';
import React from 'react';
import {
  MBlockInitializers,
  MMenuBlockInitializer,
  MGrid,
  MMenu,
  MContainer,
  MTabBar,
  MPage,
  MHeader,
  useGridCardBlockItemProps,
} from './schema';

export const MobileCore: React.FC = (props) => {
  return (
    <SchemaInitializerProvider
      initializers={{
        MBlockInitializers,
      }}
    >
      <SchemaComponentOptions
        components={{
          MMenuBlockInitializer,
          MContainer,
          MGrid,
          MMenu,
          MTabBar,
          MPage,
          MHeader,
        }}
        scope={{
          useGridCardBlockItemProps,
        }}
      >
        {props.children}
      </SchemaComponentOptions>
    </SchemaInitializerProvider>
  );
};
