import { ObjectField } from '@formily/core';
import { Schema } from '@formily/react';
import { ComponentType, createContext } from 'react';
import { DynamicComponentProps } from './DynamicComponent';

export interface FilterContextProps {
  field?: ObjectField & { collectionName?: string };
  fieldSchema?: Schema;
  dynamicComponent?: ComponentType<DynamicComponentProps>;
  options?: any[];
  disabled?: boolean;
  collectionName?: string;
}

export const RemoveConditionContext = createContext(null);
RemoveConditionContext.displayName = 'RemoveConditionContext';
export const FilterContext = createContext<FilterContextProps>(null);
FilterContext.displayName = 'FilterContext';
export const FilterLogicContext = createContext(null);
FilterLogicContext.displayName = 'FilterLogicContext';
