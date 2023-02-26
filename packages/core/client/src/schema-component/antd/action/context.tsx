import { Schema } from '@formily/react';
import { createContext } from 'react';

export const ActionContext = createContext<ActionContextProps>({});

export type OpenSize = 'small' | 'middle' | 'large';
export interface ActionContextProps {
  button?: any;
  visible?: boolean;
  setVisible?: (v: boolean) => void;
  openMode?: 'drawer' | 'modal' | 'page';
  snapshot?: boolean;
  action?: 'create' | 'update' | 'destroy' | 'view';
  openSize?: OpenSize;
  containerRefKey?: string;
  formValueChanged?: boolean;
  setFormValueChanged?: (v: boolean) => void;
  fieldSchema?: Schema;
}
