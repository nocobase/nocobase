import React, { createContext } from 'react';
import { InsertType, SchemaInitializerOptions } from '../types';

export const SchemaInitializerContext = createContext<{
  insert: InsertType;
  options: SchemaInitializerOptions;
  visible?: boolean;
  setVisible?: (v: boolean) => void;
}>({} as any);
SchemaInitializerContext.displayName = 'SchemaInitializerContext';

export const useSchemaInitializer = () => {
  return React.useContext(SchemaInitializerContext);
};
