import { createContext, useContext } from 'react';

export const AuthTypeContext = createContext<{
  type: string;
}>({ type: '' });

export const AuthTypesContext = createContext<{
  types: {
    key: string;
    label: string;
    value: string;
  }[];
}>({ types: [] });

export const useAuthTypes = () => {
  const { types } = useContext(AuthTypesContext);
  return types;
};
