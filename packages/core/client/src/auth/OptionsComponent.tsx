import React, { FC, FunctionComponent, createContext, useContext, createElement } from 'react';
import { useTranslation } from 'react-i18next';

const OptionsComponentContext = createContext<{
  [authType: string]: FunctionComponent;
}>({});

export const OptionsComponentProvider: FC<{ authType: string; component: FunctionComponent }> = (props) => {
  const components = useContext(OptionsComponentContext);
  components[props.authType] = props.component;
  return <OptionsComponentContext.Provider value={components}>{props.children}</OptionsComponentContext.Provider>;
};

export const useOptionsComponent = (authType: string) => {
  const { t } = useTranslation();
  const components = useContext(OptionsComponentContext);
  return components[authType] ? (
    createElement(components[authType])
  ) : (
    <div style={{ color: '#ccc' }}>{t('No configuration available.')}</div>
  );
};
