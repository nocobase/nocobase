/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createContext, useContext } from 'react';

export interface ImportContextType {
  importModalVisible: boolean;
  setImportModalVisible: (visible: boolean) => void;
  importStatus: number;
  setImportStatus: (status: number) => void;
  importResult: { data: { type: string; data: any[] }; meta: { successCount: number; failureCount: number } };
  setImportResult: (result: {
    data: { type: string; data: any[] };
    meta: { successCount: number; failureCount: number };
  }) => void;
}

export const ImportContext = createContext<ImportContextType>(null);
ImportContext.displayName = 'ImportContext';

export const useImportContext = () => {
  return useContext(ImportContext);
};
