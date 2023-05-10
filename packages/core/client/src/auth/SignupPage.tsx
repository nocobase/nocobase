import { message } from 'antd';
import React, { useContext, createContext, FunctionComponent, createElement } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useHistory, useLocation, useParams } from 'react-router-dom';
import { useAPIClient, useCurrentDocumentTitle } from '..';
import { useForm } from '@formily/react';

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

export interface UseSignupProps {
  authenticator?: string;
  message?: {
    success?: string;
  };
}

export const useSignup = (props?: UseSignupProps) => {
  const history = useHistory();
  const form = useForm();
  const api = useAPIClient();
  const { t } = useTranslation();
  return {
    async run() {
      await form.submit();
      await api.auth.signUp(form.values, props?.authenticator);
      message.success(props?.message?.success || t('Sign up successfully, and automatically jump to the sign in page'));
      setTimeout(() => {
        history.push('/signin');
      }, 2000);
    },
  };
};

function useQuery() {
  const { search } = useLocation();

  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export const SignupPage = () => {
  const { t } = useTranslation();
  useCurrentDocumentTitle('Signup');
  const query = useQuery();
  const authType = query.get('authType');
  const name = query.get('name');
  const signUpPages = useContext(SignupPageContext);
  if (!signUpPages[authType]) {
    return (
      <div>
        <div style={{ color: '#ccc' }}>Oops! The authentication type doesn not allow sign-up.</div>
        <Link to="/signin">{t('Return')}</Link>
      </div>
    );
  }
  return createElement(signUpPages[authType].component, { name });
};
