import React, { createContext } from 'react';
import { InsertType, SchemaInitializerOptions } from '../types';

export const SchemaInitializerV2Context = createContext<{ insert: InsertType; options: SchemaInitializerOptions }>(
  {} as any,
);
SchemaInitializerV2Context.displayName = 'SchemaInitializerV2Context';

export const useSchemaInitializer = () => {
  return React.useContext(SchemaInitializerV2Context);
};
