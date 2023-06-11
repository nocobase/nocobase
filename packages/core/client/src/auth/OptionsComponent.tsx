import React, { FunctionComponent, createContext, useContext, createElement } from 'react';
import { useTranslation } from 'react-i18next';

const OptionsComponentContext = createContext<{
  [authType: string]: FunctionComponent;
}>({});

export const OptionsComponentProvider: React.FC<{ authType: string; component: FunctionComponent }> = (props) => {
  const components = useContext(OptionsComponentContext);
  components[props.authType] = props.component;
  return <OptionsComponentContext.Provider value={components}>{props.children}</OptionsComponentContext.Provider>;
};

export const useHasOptionsComponent = (authType: string) => {
  const components = useContext(OptionsComponentContext);
  return components[authType];
};

export const useOptionsComponent = (authType: string) => {
  const { t } = useTranslation();
  const component = useHasOptionsComponent(authType);
  return component ? createElement(component) : <></>;
};
