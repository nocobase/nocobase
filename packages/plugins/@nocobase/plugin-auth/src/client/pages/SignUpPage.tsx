import { useCurrentDocumentTitle, usePlugin, useViewport } from '@nocobase/client';
import React, { useContext, createContext, FunctionComponent, createElement } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import AuthPlugin, { AuthPage } from '..';
import { useAuthenticator } from '../authenticator';

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

export const SignUpPage = () => {
  useViewport();
  useCurrentDocumentTitle('Signup');
  const signUpPages = useSignUpPages();
  const [searchParams] = useSearchParams();
  const name = searchParams.get('name');
  const authenticator = useAuthenticator(name);
  const { authType } = authenticator || {};
  if (!signUpPages[authType]) {
    return <Navigate to="/not-found" replace={true} />;
  }
  return createElement(signUpPages[authType].Component, { authenticatorName: name });
};
