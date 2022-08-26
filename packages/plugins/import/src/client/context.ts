import { createContext, useContext } from 'react';

export interface ImportContextType {
  importModalVisible: boolean;
  setImportModalVisible: (visible: boolean) => void;
  importStatus: number;
  setImportStatus: (status: number) => void;
  importResult: { successCount: number; failureCount: number };
  setImportResult: (result: { successCount: number; failureCount: number }) => void;
}

export const ImportContext = createContext<ImportContextType>(null);

export const useImportContext = () => {
  return useContext(ImportContext);
};
