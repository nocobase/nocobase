import type { ObjectField } from '@formily/core';
import type { Schema } from '@formily/react';
import { createContext } from 'react';

export interface FilterContextProps {
  field?: ObjectField;
  fieldSchema?: Schema;
  dynamicComponent?: any;
  options?: any[];
  disabled?: boolean;
}

export const RemoveActionContext = createContext(null);
export const FilterContext = createContext<FilterContextProps>(null);
export const LinkageLogicContext = createContext(null);
