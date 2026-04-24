/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Empty, Space, Tabs } from 'antd';
import React, { createElement, useContext, useMemo } from 'react';
import { usePlugin } from '@nocobase/client-v2';
import { BasicSignInForm } from '../forms/BasicSignInForm';
import PluginAuthClientV2, { type AuthOptions } from '../plugin';
import { AuthenticatorsContext } from '../authenticator';
import { useAuthTranslation } from '../locale';
import { useDocumentTitle } from '../hooks';

export function useSignInForms(): Record<string, AuthOptions['components']['SignInForm']> {
  const plugin = usePlugin(PluginAuthClientV2);
  const authTypes = plugin.authTypes.getEntities();
  const forms: Record<string, AuthOptions['components']['SignInForm']> = {};

  for (const [authType, options] of authTypes) {
    if (options.components?.SignInForm) {
      forms[authType] = options.components.SignInForm;
    }
  }

  return forms;
}

export function useSignInButtons(authenticators = []) {
  const plugin = usePlugin(PluginAuthClientV2);
  const authTypes = plugin.authTypes.getEntities();
  const customButtons = {};

  for (const [authType, options] of authTypes) {
    if (options.components?.SignInButton) {
      customButtons[authType] = options.components.SignInButton;
    }
  }

  return authenticators
    .filter((authenticator) => customButtons[authenticator.authType])
    .map((authenticator, index) =>
      createElement(customButtons[authenticator.authType], { key: `${authenticator.name}-${index}`, authenticator }),
    );
}

export default function SignInPage() {
  const { t } = useAuthTranslation();
  const signInForms = useSignInForms();
  const authenticators = useContext(AuthenticatorsContext);
  const signInButtons = useSignInButtons(authenticators);

  useDocumentTitle(t('Signin'));

  const tabs = useMemo(() => {
    return authenticators
      .map((authenticator) => {
        const FormComponent = signInForms[authenticator.authType];
        if (!FormComponent) {
          return null;
        }
        return {
          key: authenticator.name,
          label: authenticator.title || `${t('Sign-in')} (${authenticator.authTypeTitle || authenticator.authType})`,
          children: createElement(FormComponent, { authenticator }),
        };
      })
      .filter(Boolean);
  }, [authenticators, signInForms, t]);

  if (!authenticators.length) {
    return <Empty description={t('No authentication methods available.')} />;
  }

  return (
    <Space direction="vertical" style={{ display: 'flex' }}>
      {tabs.length > 1 ? <Tabs items={tabs} /> : tabs.length ? tabs[0].children : null}
      {signInButtons.length ? <Space direction="vertical">{signInButtons}</Space> : null}
    </Space>
  );
}
