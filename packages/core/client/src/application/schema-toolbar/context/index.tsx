import React from 'react';
import { createContext, useContext } from 'react';

export const SchemaToolbarContext = createContext<any>({});
SchemaToolbarContext.displayName = 'SchemaToolbarContext';

export const SchemaToolbarProvider = (props: any) => {
  const { children, ...others } = props;
  return <SchemaToolbarContext.Provider value={others}>{children}</SchemaToolbarContext.Provider>;
};

export function useSchemaToolbar<T = any>() {
  return useContext(SchemaToolbarContext) as T;
}
