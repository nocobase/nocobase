import { ObjectField } from '@formily/core';
import { Schema } from '@formily/react';
import { createContext } from 'react';
import { CollectionFieldOptions } from '../../../collection-manager';

export interface FilterContextProps {
  field?: ObjectField;
  fieldSchema?: Schema;
  collectionFields: CollectionFieldOptions;
  dynamicComponent?: any;
  options?: any[];
  disabled?: boolean;
}

export const RemoveConditionContext = createContext(null);
export const FilterContext = createContext<FilterContextProps>(null);
export const FilterLogicContext = createContext(null);
