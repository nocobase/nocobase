import { ObjectField } from '@formily/core';
import { Schema } from '@formily/react';
import { createContext } from 'react';

export interface FilterContextProps {
  field?: ObjectField;
  fieldSchema?: Schema;
  dynamicComponent?: any;
  options?: any[];
  disabled?: boolean;
}

export const RemoveActionContext = createContext(null);
RemoveActionContext.displayName = 'RemoveActionContext';
export const FilterContext = createContext<FilterContextProps>(null);
FilterContext.displayName = 'FilterContext';
export const LinkageLogicContext = createContext(null);
LinkageLogicContext.displayName = 'LinkageLogicContext';
