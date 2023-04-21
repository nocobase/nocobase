import { SchemaComponentOptions, SchemaInitializerProvider } from '@nocobase/client';
import React from 'react';
import {
  MBlockInitializers,
  MMenuBlockInitializer,
  MListBlockInitializer,
  MListActionInitializers,
  MGrid,
  MMenu,
  MContainer,
  MTabBar,
  MPage,
  MHeader,
  MList,
  useListBlockProps,
  useListItemBlockProps,
  useListItemActionProps,
} from './schema';

export const MobileCore: React.FC = (props) => {
  return (
    <SchemaInitializerProvider
      initializers={{
        MBlockInitializers,
        MListActionInitializers,
      }}
    >
      <SchemaComponentOptions
        components={{
          MMenuBlockInitializer,
          MListBlockInitializer,
          MContainer,
          MGrid,
          MMenu,
          MTabBar,
          MPage,
          MHeader,
          MList,
        }}
        scope={{
          useListBlockProps,
          useListItemBlockProps,
          useListItemActionProps,
        }}
      >
        {props.children}
      </SchemaComponentOptions>
    </SchemaInitializerProvider>
  );
};
