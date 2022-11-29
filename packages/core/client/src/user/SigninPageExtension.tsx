import React, { createContext, useContext } from 'react';

export interface SigninPageExtensionContextValue {
  components: JSX.Element[];
}

let count = 0;

export const SigninPageExtensionContext = createContext<SigninPageExtensionContextValue>({ components: [] });

export const SigninPageExtensionProvider = (props: { component: JSX.Element; children: JSX.Element }) => {
  const { components } = useContext(SigninPageExtensionContext);

  const list = props.component ? [...components, props.component] : components;

  return (
    <SigninPageExtensionContext.Provider value={{ components: list.map((i) => ({ ...i, key: count++ })) }}>
      {props.children}
    </SigninPageExtensionContext.Provider>
  );
};
