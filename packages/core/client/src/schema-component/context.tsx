import React, { FC, createContext, useMemo } from 'react';
import { ISchemaComponentContext } from './types';

export const SchemaComponentContext = createContext<ISchemaComponentContext>({});
SchemaComponentContext.displayName = 'SchemaComponentContext';
export const SchemaComponentChangelessContext = createContext<ISchemaComponentContext>({});
SchemaComponentChangelessContext.displayName = 'SchemaComponentChangelessContext';

export const SchemaComponentContextProvider: FC<{ value: ISchemaComponentContext }> = ({ children, value }) => {
  const changelessContextValue = useMemo(() => {
    return value;
  }, Object.values(value));
  return <SchemaComponentContext.Provider value={value}>
    <SchemaComponentChangelessContext.Provider value={changelessContextValue}>
      {children}
    </SchemaComponentChangelessContext.Provider>
  </SchemaComponentContext.Provider>;
};
