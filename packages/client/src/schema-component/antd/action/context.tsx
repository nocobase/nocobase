import { createContext } from 'react';

export const ActionContext = createContext<ActionContextProps>({});

export interface ActionContextProps {
  visible?: boolean;
  setVisible?: (v: boolean) => void;
  openMode?: 'drawer' | 'modal' | 'page';
  containerRefKey?: string;
}
