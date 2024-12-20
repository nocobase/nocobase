/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaComponentOptions } from '@nocobase/client';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ImportActionInitializer, ImportDesigner, ImportWarning, DownloadTips } from '.';
import { ImportContext } from './context';
import { ImportModal, ImportStatus } from './ImportModal';
import { useDownloadXlsxTemplateAction, useImportStartAction } from './useImportAction';
import { useShared } from './useShared';
import { ImportAction } from './ImportAction';

export const ImportPluginProvider = (props: any) => {
  const { uploadValidator, beforeUploadHandler, validateUpload } = useShared();
  return (
    <SchemaComponentOptions
      components={{ ImportActionInitializer, ImportDesigner, ImportWarning, DownloadTips, ImportAction }}
      scope={{
        uploadValidator,
        validateUpload,
        beforeUploadHandler,
        useDownloadXlsxTemplateAction,
        useImportStartAction,
      }}
    >
      <ImportContextProvider>{props.children}</ImportContextProvider>
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
