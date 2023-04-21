import { SchemaComponentOptions, SchemaInitializerProvider } from '@nocobase/client';
import React from 'react';
import {
  MBlockInitializers,
  MMenuBlockInitializer,
  DetailsListBlockInitializer,
  DetailsListActionInitializers,
  MGrid,
  MMenu,
  MContainer,
  MTabBar,
  MPage,
  MHeader,
  DetailsList,
  useDetailsListBlockProps,
  useListItemBlockProps,
  useListItemActionProps,
} from './schema';

export const MobileCore: React.FC = (props) => {
  return (
    <SchemaInitializerProvider
      initializers={{
        MBlockInitializers,
        DetailsListActionInitializers,
      }}
    >
      <SchemaComponentOptions
        components={{
          MMenuBlockInitializer,
          DetailsListBlockInitializer,
          MContainer,
          MGrid,
          MMenu,
          MTabBar,
          MPage,
          MHeader,
          DetailsList,
        }}
        scope={{
          useDetailsListBlockProps,
          useListItemBlockProps,
          useListItemActionProps,
        }}
      >
        {props.children}
      </SchemaComponentOptions>
    </SchemaInitializerProvider>
  );
};
