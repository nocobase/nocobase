import { useCurrentDocumentTitle, usePlugin, useViewport } from '@nocobase/client';
import React, { useContext, createContext, FunctionComponent, createElement, ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router-dom';
import AuthPlugin, { AuthPage } from '..';

export const SignupPageContext = createContext<{
  [authType: string]: {
    component: FunctionComponent<{
      name: string;
    }>;
  };
}>({});

export const SignupPageProvider: React.FC<{
  authType: string;
  component: FunctionComponent<{
    name: string;
  }>;
}> = (props) => {
  const components = useContext(SignupPageContext);
  components[props.authType] = {
    component: props.component,
  };
  return <SignupPageContext.Provider value={components}>{props.children}</SignupPageContext.Provider>;
};

export const useSignUpPages = (): {
  [authType: string]: AuthPage['signUp'];
} => {
  const plugin = usePlugin(AuthPlugin);
  const pages = plugin.authPages.getEntities();
  const signUpPages = {};
  for (const [authType, page] of pages) {
    signUpPages[authType] = page.signUp;
  }
  return signUpPages;
};

export const SignupPage = () => {
  const { t } = useTranslation();
  useViewport();
  useCurrentDocumentTitle('Signup');
  const [searchParams] = useSearchParams();
  const authType = searchParams.get('authType');
  const name = searchParams.get('name');
  const signUpPages = useSignUpPages();
  if (!signUpPages[authType]) {
    return (
      <div>
        <div style={{ color: '#ccc' }}>{t('Oops! The authentication type does not allow sign-up.')}</div>
        <Link to="/signin">{t('Return')}</Link>
      </div>
    );
  }
  return createElement(signUpPages[authType].Component, { name });
};
