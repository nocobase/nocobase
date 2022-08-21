import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import {
  beforeUploadHandler,
  ImportActionInitializer,
  ImportDesigner,
  ImportInitializerProvider,
  useImportAction,
} from '.';

export const ImportPluginProvider = (props: any) => {
  return (
    <SchemaComponentOptions
      components={{ ImportActionInitializer, ImportDesigner }}
      scope={{ beforeUploadHandler, useImportAction }}
    >
      <ImportInitializerProvider>{props.children}</ImportInitializerProvider>
    </SchemaComponentOptions>
  );
};
