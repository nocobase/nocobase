import { SchemaComponentOptions } from '@nocobase/client';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ImportActionInitializer, ImportDesigner, ImportInitializerProvider } from '.';
import { ImportContext } from './context';
import { ImportModal, ImportStatus } from './ImportModal';
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
      <ImportInitializerProvider>
        <ImportContextProvider>{props.children}</ImportContextProvider>
      </ImportInitializerProvider>
    </SchemaComponentOptions>
  );
};

export const ImportContextProvider = (props: any) => {
  const [importModalVisible, setImportModalVisible] = useState(false);
  const [importStatus, setImportStatus] = useState<number>(ImportStatus.IMPORTING);
  const [importResult, setImportResult] = useState<{
    data: { type: string; data: any[] };
    meta: { successCount: number; failureCount: number };
  }>(null);
  return (
    <ImportContext.Provider
      value={{
        importModalVisible,
        setImportModalVisible,
        importStatus,
        setImportStatus,
        importResult,
        setImportResult,
      }}
    >
      {createPortal(<ImportModal></ImportModal>, document.body)}
      {props.children}
    </ImportContext.Provider>
  );
};
