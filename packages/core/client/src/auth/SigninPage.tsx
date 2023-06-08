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
import { useNavigate, useLocation } from 'react-router-dom';
import { useAPIClient, useCurrentDocumentTitle, useRequest } from '..';
import { useSigninPageExtension } from './SigninPageExtension';
import { useForm } from '@formily/react';

const SigninPageContext = createContext<{
  [authType: string]: {
    component: FunctionComponent;
    tabTitle?: string;
  };
}>({});

export const SigninPageProvider: React.FC<{
  authType: string;
  component: FunctionComponent<{ authenticator: Authenticator }>;
  tabTitle?: string;
}> = (props) => {
  const components = useContext(SigninPageContext);
  components[props.authType] = {
    component: props.component,
    tabTitle: props.tabTitle,
  };
  return <SigninPageContext.Provider value={components}>{props.children}</SigninPageContext.Provider>;
};

export type Authenticator = {
  name: string;
  authType: string;
  title?: string;
  options?: {
    [key: string]: any;
  };
  sort?: number;
};

export const AuthenticatorsContext = createContext<Authenticator[]>([]);

export function useRedirect(next = '/admin') {
  const location = useLocation();
  const navigate = useNavigate();
  const redirect = location?.['query']?.redirect;
  return useCallback(() => {
    navigate(redirect || '/admin');
  }, [navigate, redirect]);
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
  const api = useAPIClient();
  const [authenticators, setAuthenticators] = useState<Authenticator[]>([]);
  const [tabs, setTabs] = useState<
    (Authenticator & {
      component: FunctionComponentElement<{ authenticator: Authenticator }>;
      tabTitle: string;
    })[]
  >([]);
  const signinExtension = useSigninPageExtension(authenticators);

  const handleAuthenticators = (authenticators: Authenticator[]) => {
    const tabs = authenticators
      .map((authenticator) => {
        const page = signInPages[authenticator.authType];
        if (!page) {
          return;
        }
        return {
          component: createElement<{
            authenticator: Authenticator;
          }>(page.component, { authenticator }),
          tabTitle: authenticator.title || page.tabTitle || authenticator.name,
          ...authenticator,
        };
      })
      .filter((i) => i);

    setAuthenticators(authenticators);
    setTabs(tabs);
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
    <AuthenticatorsContext.Provider value={authenticators}>
      <Space
        direction="vertical"
        className={css`
          display: flex;
        `}
      >
        {tabs.length > 1 ? (
          <Tabs>
            {tabs.map((tab) => (
              <Tabs.TabPane tab={tab.tabTitle} key={tab.name}>
                {tab.component}
              </Tabs.TabPane>
            ))}
          </Tabs>
        ) : tabs.length ? (
          <div>{tabs[0].component}</div>
        ) : (
          <></>
        )}
        <Space
          direction="vertical"
          className={css`
            display: flex;
          `}
        >
          {signinExtension}
        </Space>
      </Space>
    </AuthenticatorsContext.Provider>
  );
};
