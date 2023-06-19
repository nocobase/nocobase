import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { Iframe } from './Iframe';
import { IframeBlockInitializer } from './IframeBlockInitializer';
import { IframeBlockInitializerProvider } from './IframeBlockInitializerProvider';

export const IframeBlockProvider = (props: any) => {
  return (
    <SchemaComponentOptions components={{ Iframe, IframeBlockInitializer }}>
      <IframeBlockInitializerProvider>{props.children}</IframeBlockInitializerProvider>
    </SchemaComponentOptions>
  );
};
