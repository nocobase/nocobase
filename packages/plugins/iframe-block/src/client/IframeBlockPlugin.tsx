import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { Iframe } from './Iframe';
import { IframeBlockInitializer } from './IframeBlockInitializer';
import { IframeBlockInitializerProvider } from './IframeBlockInitializerProvider';

export const IframeBlockPlugin = (props: any) => {
  return (
    <SchemaComponentOptions components={{ Iframe, IframeBlockInitializer }}>
      <IframeBlockInitializerProvider>{props.children}</IframeBlockInitializerProvider>
    </SchemaComponentOptions>
  );
};
