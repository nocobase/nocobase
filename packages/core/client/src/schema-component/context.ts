import { createContext } from 'react';
import { ISchemaComponentContext } from './types';

export const SchemaComponentContext = createContext<ISchemaComponentContext>({});
SchemaComponentContext.displayName = 'SchemaComponentContext.Provider';
