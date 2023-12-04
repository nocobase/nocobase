import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { Iframe } from './Iframe';
import { IframeBlockInitializer } from './IframeBlockInitializer';

export const IframeBlockProvider = (props: any) => {
  return (
    <SchemaComponentOptions components={{ Iframe, IframeBlockInitializer }}>{props.children}</SchemaComponentOptions>
  );
};
