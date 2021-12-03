import { createContext } from 'react';
import { ITableContext, ITableRowContext } from './types';

export const TableContext = createContext<ITableContext>({} as any);
export const CollectionFieldContext = createContext(null);
export const TableRowContext = createContext<ITableRowContext>(null);
