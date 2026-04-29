/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Empty } from 'antd';
import { useSearchParams } from 'react-router-dom';
import { usePlugin } from '@nocobase/client-v2';
import PluginAuthClientV2, { type AuthOptions } from '../plugin';
import { useAuthenticator } from '../authenticator';
import { useAuthTranslation } from '../locale';
import { useDocumentTitle } from '../hooks';

export function useSignUpForms(): Record<string, AuthOptions['components']['SignUpForm']> {
  const plugin = usePlugin(PluginAuthClientV2);
  const authTypes = plugin.authTypes.getEntities();
  const forms: Record<string, AuthOptions['components']['SignUpForm']> = {};

  for (const [authType, options] of authTypes) {
    if (options.components?.SignUpForm) {
      forms[authType] = options.components.SignUpForm;
    }
  }

  return forms;
}

export default function SignUpPage() {
  const { t } = useAuthTranslation();
  const [searchParams] = useSearchParams();
  const name = searchParams.get('name');
  const authenticator = useAuthenticator(name);
  const signUpForms = useSignUpForms();

  useDocumentTitle(t('Signup'));

  if (!authenticator) {
    return <Empty description={t('No authentication methods available.')} />;
  }

  const FormComponent = signUpForms[authenticator.authType];
  if (!FormComponent) {
    return <Empty description={t('No authentication methods available.')} />;
  }

  return <FormComponent authenticatorName={authenticator.name} />;
}
