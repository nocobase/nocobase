import React, { FC, FunctionComponent, createContext, useContext, createElement } from 'react';

const OptionsComponentContext = createContext<{
  [authType: string]: FunctionComponent;
}>({});

export const OptionsComponentProvider: FC<{ authType: string; component: FunctionComponent }> = (props) => {
  const components = useContext(OptionsComponentContext);
  components[props.authType] = props.component;
  return <OptionsComponentContext.Provider value={components}>{props.children}</OptionsComponentContext.Provider>;
};

export const useOptionsComponent = (authType: string) => {
  const components = useContext(OptionsComponentContext);
  return createElement(components[authType]) || <div style={{ color: '#ccc' }}>No options available.</div>;
};
