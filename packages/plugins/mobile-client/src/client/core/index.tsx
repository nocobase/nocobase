import { SchemaComponentOptions, SchemaInitializerProvider } from '@nocobase/client';
import React from 'react';
import {
  MBlockInitializers,
  MMenuBlockInitializer,
  MMenu,
  MContainer,
  MTabBar,
  MPage,
  MHeader,
  MSettingsBlockInitializer,
  MSettings,
  useGridCardBlockItemProps,
  useGridCardBlockProps,
} from './schema';
import './bridge';

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
          MSettingsBlockInitializer,
          MContainer,
          MMenu,
          MTabBar,
          MPage,
          MHeader,
          MSettings,
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
