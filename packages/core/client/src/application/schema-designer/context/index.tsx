import React from 'react';
import { createContext, useContext } from 'react';

export const SchemaDesignerContext = createContext<any>({});
SchemaDesignerContext.displayName = 'SchemaDesignerContext';

export const SchemaDesignerProvider = (props: any) => {
  const { children, ...others } = props;
  return <SchemaDesignerContext.Provider value={others}>{children}</SchemaDesignerContext.Provider>;
};

export function useSchemaDesigner<T = any>() {
  return useContext(SchemaDesignerContext) as T;
}
