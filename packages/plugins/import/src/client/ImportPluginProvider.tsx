import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { ImportActionInitializer, ImportDesigner, ImportInitializerProvider, useImportAction } from '.';

export const ImportPluginProvider = (props: any) => {
  return (
    <SchemaComponentOptions components={{ ImportActionInitializer, ImportDesigner }} scope={{ useImportAction }}>
      <ImportInitializerProvider>{props.children}</ImportInitializerProvider>
    </SchemaComponentOptions>
  );
};
