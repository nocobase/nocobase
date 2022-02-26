import { createContext } from 'react';

export const FilterContext = createContext<FilterContextProps>({});

export interface FilterContextProps {
  visible?: boolean;
  setVisible?: (v: boolean) => void;
}
