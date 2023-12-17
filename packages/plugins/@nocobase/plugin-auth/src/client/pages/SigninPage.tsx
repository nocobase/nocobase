import { css } from '@emotion/css';
import { Space, Tabs } from 'antd';
import React, { ReactElement, createContext, createElement, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient, useCurrentDocumentTitle, usePlugin, useRequest, useViewport } from '@nocobase/client';
import AuthPlugin, { AuthPage } from '..';

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

export const useSignInPages = (): {
  [authType: string]: AuthPage['signIn'];
} => {
  const plugin = usePlugin(AuthPlugin);
  const pages = plugin.authPages.getEntities();
  const signInPages = {};
  for (const [authType, page] of pages) {
    const signInPage = page.signIn;
    if (signInPage.display !== 'form') {
      continue;
    }
    signInPages[authType] = signInPage;
  }
  return signInPages;
};

export const useCustomSignIn = (authenticators = []) => {
  const plugin = usePlugin(AuthPlugin);
  const pages = plugin.authPages.getEntities();
  const customs = {};
  for (const [authType, page] of pages) {
    const signInPage = page.signIn;
    if (signInPage.display !== 'custom') {
      continue;
    }
    customs[authType] = signInPage;
  }

  const types = Object.keys(customs);
  return authenticators
    .filter((authenticator) => types.includes(authenticator.authType))
    .map((authenticator, index) =>
      React.createElement(customs[authenticator.authType].Component, { key: index, authenticator }),
    );
};

export const SigninPage = () => {
  const { t } = useTranslation();
  useCurrentDocumentTitle('Signin');
  useViewport();
  const signInPages = useSignInPages();
  const api = useAPIClient();
  const [authenticators, setAuthenticators] = useState<Authenticator[]>([]);
  const [tabs, setTabs] = useState<
    (Authenticator & {
      component: ReactElement<{ authenticator: Authenticator }>;
      tabTitle: string;
    })[]
  >([]);
  const customSignIn = useCustomSignIn(authenticators);

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
          }>(page.Component, { authenticator }),
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
          {customSignIn}
        </Space>
      </Space>
    </AuthenticatorsContext.Provider>
  );
};
