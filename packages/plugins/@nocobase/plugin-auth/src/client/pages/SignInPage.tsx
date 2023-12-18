import { css } from '@emotion/css';
import { Space, Tabs } from 'antd';
import React, { createElement, useContext } from 'react';
import { useCurrentDocumentTitle, usePlugin, useViewport } from '@nocobase/client';
import AuthPlugin, { AuthPage } from '..';
import { Authenticator, AuthenticatorsContext } from '../authenticator';
import { useAuthTranslation } from '../locale';

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

export const SignInPage = () => {
  const { t } = useAuthTranslation();
  useCurrentDocumentTitle('Signin');
  useViewport();
  const signInPages = useSignInPages();
  const authenticators = useContext(AuthenticatorsContext);
  const customSignIn = useCustomSignIn(authenticators);

  if (!authenticators.length) {
    return <div style={{ color: '#ccc' }}>{t('No authentication methods available.')}</div>;
  }

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

  return (
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
  );
};
