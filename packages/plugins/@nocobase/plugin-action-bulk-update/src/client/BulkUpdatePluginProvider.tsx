import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { CustomizeActionInitializer } from './CustomizeActionInitializer';
import { useCustomizeBulkUpdateActionProps } from './utils';

export const BulkUpdatePluginProvider = (props: any) => {
  return (
    <SchemaComponentOptions
      components={{ CustomizeActionInitializer }}
      scope={{
        useCustomizeBulkUpdateActionProps,
      }}
    >
      {props.children}
    </SchemaComponentOptions>
  );
};
