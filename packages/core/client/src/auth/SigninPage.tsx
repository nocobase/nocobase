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
import { SignupPageContext, useAPIClient, useCurrentDocumentTitle, useRequest } from '..';
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
  component: FunctionComponent<{ name: string }>;
  tabTitle?: string;
}> = (props) => {
  const components = useContext(SigninPageContext);
  components[props.authType] = {
    component: props.component,
    tabTitle: props.tabTitle,
  };
  return <SigninPageContext.Provider value={components}>{props.children}</SigninPageContext.Provider>;
};

type Authenticator = {
  name: string;
  authType: string;
  title?: string;
};

export const AuthenticatorsContext = createContext<Authenticator[]>([]);

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
  const signupPages = useContext(SignupPageContext);
  const signinExtension = useSigninPageExtension();
  const api = useAPIClient();
  const [authenticators, setAuthenticators] = useState<Authenticator[]>([]);
  const [tabs, setTabs] = useState<
    (Authenticator & {
      component: FunctionComponentElement<{ name: string }>;
      allowSignup: boolean;
      tabTitle: string;
    })[]
  >([]);

  const handleAuthenticators = (
    authenticators: {
      name: string;
      authType: string;
      title?: string;
    }[],
  ) => {
    const tabs = authenticators
      .map((item) => {
        const page = signInPages[item.authType];
        if (!page) {
          return;
        }
        return {
          component: createElement<{
            name: string;
          }>(page.component, { name: item.name }),
          allowSignup: !!signupPages[item.authType],
          tabTitle: item.title || page.tabTitle || item.name,
          ...item,
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
                {tab.allowSignup && (
                  <div>
                    <Link to={`/signup?authType=${tab.authType}&name=${tab.name}`}>{t('Create an account')}</Link>
                  </div>
                )}
              </Tabs.TabPane>
            ))}
          </Tabs>
        ) : tabs.length ? (
          <div>
            {tabs[0].component}
            {tabs[0].allowSignup && (
              <div>
                <Link to={`/signup?authType=${tabs[0].authType}&name=${tabs[0].name}`}>{t('Create an account')}</Link>
              </div>
            )}
          </div>
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
