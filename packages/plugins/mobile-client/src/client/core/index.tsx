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
  MSettingBlockInitializer,
  MSetting,
  useGridCardBlockItemProps,
  useGridCardBlockProps,
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
          MSettingBlockInitializer,
          MContainer,
          MGrid,
          MMenu,
          MTabBar,
          MPage,
          MHeader,
          MSetting,
        }}
        scope={{
          useGridCardBlockItemProps,
          useGridCardBlockProps,
        }}
      >
        {props.children}
      </SchemaComponentOptions>
    </SchemaInitializerProvider>
  );
};
