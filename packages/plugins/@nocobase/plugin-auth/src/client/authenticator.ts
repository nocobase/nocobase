import { createContext, useContext } from 'react';

export type Authenticator = {
  name: string;
  authType: string;
  authTypeTitle: string;
  title?: string;
  options?: {
    [key: string]: any;
  };
  sort?: number;
};

export const AuthenticatorsContext = createContext<Authenticator[]>([]);
AuthenticatorsContext.displayName = 'AuthenticatorsContext';

export const useAuthenticator = (name: string) => {
  const authenticators = useContext(AuthenticatorsContext);
  return authenticators.find((a) => a.name === name);
};
