import { css } from '@emotion/css';
import { useForm } from '@formily/react';
import { Space, Tabs } from 'antd';
import React, {
  FunctionComponent,
  FunctionComponentElement,
  createContext,
  createElement,
  useCallback,
  useContext,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAPIClient, useApp, useCurrentDocumentTitle, useCurrentUserContext, useRequest, useViewport } from '..';
import { useSigninPageExtension } from './SigninPageExtension';

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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  return useCallback(() => {
    navigate(searchParams.get('redirect') || '/admin', { replace: true });
  }, [navigate, searchParams]);
}

export const useSignIn = (authenticator) => {
  const form = useForm();
  const api = useAPIClient();
  const redirect = useRedirect();
  const { refreshAsync } = useCurrentUserContext();
  return {
    async run() {
      await form.submit();
      await api.auth.signIn(form.values, authenticator);
      await refreshAsync();
      redirect();
    },
  };
};

export const SigninPage = () => {
  const { t } = useTranslation();
  useCurrentDocumentTitle('Signin');
  useViewport();
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

  const { error } = useRequest(
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

  if (error) {
    throw error;
  }

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
          <Tabs items={tabs.map((tab) => ({ label: t(tab.tabTitle), key: tab.name, children: tab.component }))} />
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
