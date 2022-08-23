import { SchemaComponentOptions } from '@nocobase/client';
import React from 'react';
import { ImportActionInitializer, ImportDesigner, ImportInitializerProvider } from '.';
import { useDownloadXlsxTemplateAction, useImportStartAction } from './useImportAction';
import { useShared } from './useShared';

export const ImportPluginProvider = (props: any) => {
  const { uploadValidator, beforeUploadHandler, validateUpload } = useShared();
  return (
    <SchemaComponentOptions
      components={{ ImportActionInitializer, ImportDesigner }}
      scope={{
        uploadValidator,
        validateUpload,
        beforeUploadHandler,
        useDownloadXlsxTemplateAction,
        useImportStartAction,
      }}
    >
      <ImportInitializerProvider>{props.children}</ImportInitializerProvider>
    </SchemaComponentOptions>
  );
};
