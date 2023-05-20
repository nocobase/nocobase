import { createContext } from 'react';
import type { ISchemaComponentContext } from './types';

export const SchemaComponentContext = createContext<ISchemaComponentContext>({});
