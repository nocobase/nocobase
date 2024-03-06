import { createContext, useContext } from 'react';

export const AuthTypeContext = createContext<{
  type: string;
}>({ type: '' });
AuthTypeContext.displayName = 'AuthTypeContext';

export const AuthTypesContext = createContext<{
  types: {
    key: string;
    label: string;
    value: string;
  }[];
}>({ types: [] });
AuthTypesContext.displayName = 'AuthTypesContext';

export const useAuthTypes = () => {
  const { types } = useContext(AuthTypesContext);
  return types;
};
