import React, { createContext } from 'react';
import { InsertType, SchemaInitializerItemType, SchemaInitializerOptions } from '../types';

export const SchemaInitializerContext = createContext<{
  insert: InsertType;
  options: SchemaInitializerOptions<any>;
  visible: boolean;
  setVisible: (v: boolean) => void;
}>({} as any);
SchemaInitializerContext.displayName = 'SchemaInitializerContext';

export const useSchemaInitializer = () => {
  return React.useContext(SchemaInitializerContext);
};

export const SchemaInitializerItemContext = createContext<
  Omit<
    SchemaInitializerItemType,
    'type' | 'Component' | 'component' | 'useVisible' | 'useChildren' | 'hideIfNoChildren' | 'sort' | 'componentProps'
  >
>({} as any);
SchemaInitializerItemContext.displayName = 'SchemaInitializerItemContext';

export const useSchemaInitializerItem = <T = any>(): T => {
  return React.useContext(SchemaInitializerItemContext) as T;
};
