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
