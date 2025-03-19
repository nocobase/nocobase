import React from 'react';
import { Schema } from '@formily/react';

export const ImportActionContext = React.createContext<any>({});

export const useImportActionContext = () => {
  return React.useContext(ImportActionContext);
};
