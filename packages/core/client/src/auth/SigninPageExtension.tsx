import React, { createContext, FunctionComponent, useContext } from 'react';
import { Authenticator, AuthenticatorsContext } from './SigninPage';

export interface SigninPageExtensionContextValue {
  components: {
    [authType: string]: FunctionComponent<{
      authenticator: Authenticator;
      [key: string]: any;
    }>;
  };
}

export const SigninPageExtensionContext = createContext<SigninPageExtensionContextValue>({ components: {} });

export const useSigninPageExtension = (authenticators = []) => {
  const { components } = useContext(SigninPageExtensionContext);
  const types = Object.keys(components);
  return authenticators
    .filter((authenticator) => types.includes(authenticator.authType))
    .map((authenticator, index) =>
      React.createElement(components[authenticator.authType], { key: index, authenticator }),
    );
};

export const SigninPageExtensionProvider: React.FC<{
  authType: string;
  component: FunctionComponent<{
    authenticator: Authenticator;
    [key: string]: any;
  }>;
}> = (props) => {
  const { components } = useContext(SigninPageExtensionContext);
  if (!components[props.authType]) {
    components[props.authType] = props.component;
  }

  return (
    <SigninPageExtensionContext.Provider value={{ components }}>{props.children}</SigninPageExtensionContext.Provider>
  );
};
