import React, { createContext, FunctionComponent, useContext } from 'react';

export interface SigninPageExtensionContextValue {
  components: FunctionComponent[];
}

export const SigninPageExtensionContext = createContext<SigninPageExtensionContextValue>({ components: [] });

export const useSigninPageExtension = () => {
  const { components } = useContext(SigninPageExtensionContext);
  return components.map((component, index) => React.createElement(component, { key: index }));
};

export const SigninPageExtensionProvider = (props: { component: FunctionComponent; children: JSX.Element }) => {
  const { components } = useContext(SigninPageExtensionContext);

  const list = props.component ? [...components, props.component] : components;

  return (
    <SigninPageExtensionContext.Provider value={{ components: list }}>
      {props.children}
    </SigninPageExtensionContext.Provider>
  );
};
