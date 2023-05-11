import { GeneralField } from '@formily/core';
import { createContext } from 'react';

export interface AssociationFieldContextProps {
  options: any;
  field: GeneralField;
}

export const AssociationFieldContext = createContext<AssociationFieldContextProps>(null);
