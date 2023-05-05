import { Space, Tabs } from 'antd';
import React, {
  useCallback,
  useContext,
  createContext,
  FunctionComponent,
  createElement,
  useState,
  FunctionComponentElement,
} from 'react';
import { css } from '@emotion/css';
import { useTranslation } from 'react-i18next';
import { Link, useHistory, useLocation } from 'react-router-dom';
import { useAPIClient, useCurrentDocumentTitle, useRequest } from '..';
import { useSigninPageExtension } from './SigninPageExtension';
import { useForm } from '@formily/react';

const SigninPageContext = createContext<{
  [authType: string]: {
    component: FunctionComponent;
    allowSignup?: boolean;
    tabTitle?: string;
  };
}>({});

export const SigninPageProvider = (props: {
  authType: string;
  component: FunctionComponent;
  allowSignup?: boolean;
  tabTitle?: string;
  children: JSX.Element;
}) => {
  const components = useContext(SigninPageContext);
  components[props.authType] = {
    component: props.component,
    allowSignup: props.allowSignup || true,
    tabTitle: props.tabTitle,
  };
  return <SigninPageContext.Provider value={components}>{props.children}</SigninPageContext.Provider>;
};

export function useRedirect(next = '/admin') {
  const location = useLocation<any>();
  const history = useHistory();
  const redirect = location?.['query']?.redirect;
  return useCallback(() => {
    history.push(redirect || '/admin');
  }, [redirect, history]);
}

export const useSignIn = (authenticator) => {
  const form = useForm();
  const api = useAPIClient();
  const redirect = useRedirect();
  return {
    async run() {
      await form.submit();
      await api.auth.signIn(form.values, authenticator);
      redirect();
    },
  };
};

export const SigninPage = () => {
  const { t } = useTranslation();
  useCurrentDocumentTitle('Signin');
  const signInPages = useContext(SigninPageContext);
  const signinExtension = useSigninPageExtension();
  const api = useAPIClient();
  const [authenticators, setAuthenticators] = useState<
    {
      component: FunctionComponentElement<{ name: string }>;
      allowSignup: boolean;
      tabTitle: string;
      authType: string;
      name: string;
    }[]
  >([]);

  const handleAuthenticators = (
    data: {
      name: string;
      authType: string;
    }[],
  ) => {
    const authenticators = data
      .map((item) => {
        const page = signInPages[item.authType];
        if (!page) {
          return;
        }
        return {
          component: createElement<{
            name: string;
          }>(page.component, { name: item.name }),
          allowSignup: page.allowSignup,
          tabTitle: page.tabTitle || item.name,
          ...item,
        };
      })
      .filter((i) => i);

    setAuthenticators(authenticators);
  };

  useRequest(
    () =>
      api
        .resource('authenticators')
        .publicList()
        .then((res) => {
          return res?.data?.data || [];
        }),
    {
      onSuccess: (data) => {
        handleAuthenticators(data);
      },
    },
  );

  if (!authenticators.length) {
    return <div style={{ color: '#ccc' }}>{t('Oops! No authentication methods available.')}</div>;
  }

  return (
    <Space
      direction="vertical"
      className={css`
        display: flex;
      `}
    >
      {authenticators.length > 1 ? (
        <Tabs>
          {authenticators.map((item) => (
            <Tabs.TabPane tab={item.tabTitle} key={item.name}>
              {item.component}
              {item.allowSignup && (
                <div>
                  <Link to="/signup">{t('Create an account')}</Link>
                </div>
              )}
            </Tabs.TabPane>
          ))}
        </Tabs>
      ) : (
        <div>
          {authenticators[0].component}
          {authenticators[0].allowSignup && (
            <div>
              <Link to="/signup">{t('Create an account')}</Link>
            </div>
          )}
        </div>
      )}
      <div>{signinExtension}</div>
    </Space>
  );
};
