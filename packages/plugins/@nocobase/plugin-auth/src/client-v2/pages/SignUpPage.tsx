/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { usePlugin } from '@nocobase/client-v2';
import { Empty, Spin } from 'antd';
import React, { lazy, Suspense, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthenticator } from '../authenticator';
import { useDocumentTitle } from '../hooks';
import { useAuthTranslation } from '../locale';
import PluginAuthClientV2 from '../plugin';

export default function SignUpPage() {
  const { t } = useAuthTranslation();
  const [searchParams] = useSearchParams();
  const name = searchParams.get('name');
  const authenticator = useAuthenticator(name);
  const plugin = usePlugin(PluginAuthClientV2);

  const FormComponent = useMemo(() => {
    if (!authenticator) return null;
    const loader = plugin.authTypes.get(authenticator.authType)?.signUpFormLoader;
    return loader ? lazy(loader) : null;
  }, [authenticator, plugin]);

  useDocumentTitle(t('Signup'));

  if (!authenticator || !FormComponent) {
    return <Empty description={t('No authentication methods available.')} />;
  }

  return (
    <Suspense fallback={<Spin />}>
      <FormComponent authenticatorName={authenticator.name} />
    </Suspense>
  );
}
