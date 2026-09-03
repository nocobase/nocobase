/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeV2RedirectPath, useApp, usePlugin } from '@nocobase/client-v2';
import { Empty, Space, Spin, Tabs } from 'antd';
import React, { lazy, Suspense, useContext, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthenticatorsContext, type Authenticator } from '../authenticator';
import { useDocumentTitle } from '../hooks';
import { useAuthTranslation, useT } from '../locale';
import PluginAuthClientV2, { type AuthOptions } from '../plugin';

type LoaderMap<L> = Record<string, L>;

function useLoaderMap<K extends keyof AuthOptions>(field: K): LoaderMap<NonNullable<AuthOptions[K]>> {
  const plugin = usePlugin(PluginAuthClientV2);
  return useMemo(() => {
    const result: LoaderMap<NonNullable<AuthOptions[K]>> = {};
    for (const [authType, options] of plugin.authTypes.getEntities()) {
      const loader = options[field];
      if (loader) {
        result[authType] = loader as NonNullable<AuthOptions[K]>;
      }
    }
    return result;
  }, [plugin, field]);
}

function lazyByAuthType<P>(loaderMap: LoaderMap<() => Promise<{ default: React.ComponentType<P> }>>) {
  const cache = new Map<string, React.LazyExoticComponent<React.ComponentType<P>>>();
  return (authType: string) => {
    if (!loaderMap[authType]) return undefined;
    if (!cache.has(authType)) {
      cache.set(authType, lazy(loaderMap[authType]));
    }
    return cache.get(authType);
  };
}

export default function SignInPage() {
  const app = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useAuthTranslation();
  // `authTypeTitle` 从服务端来时是 `tval` 生成的原始模板字符串
  // （`{{t("Password", {"ns":"@nocobase/plugin-auth"})}}`），不展开就会直出到 tab label
  // 上。v1 走 `Schema.compile(value, { t })` 展开；v2 用 `useT()`，它内部走
  // `flowEngine.context.t`，对纯字符串和模板字符串都安全（无模板时原样返回）。
  const compileT = useT();
  const authenticators = useContext(AuthenticatorsContext);
  const signInFormLoaders = useLoaderMap('signInFormLoader');
  const signInButtonLoaders = useLoaderMap('signInButtonLoader');

  const resolveSignInForm = useMemo(() => lazyByAuthType(signInFormLoaders), [signInFormLoaders]);
  const resolveSignInButton = useMemo(() => lazyByAuthType(signInButtonLoaders), [signInButtonLoaders]);

  useDocumentTitle(t('Signin'));
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    const normalized = normalizeV2RedirectPath(app, redirect);
    if (redirect === normalized) {
      return;
    }

    params.set('redirect', normalized);
    navigate(
      {
        pathname: location.pathname,
        search: `?${params}`,
      },
      { replace: true },
    );
  }, [app, location.pathname, location.search, navigate]);

  const tabs = useMemo(() => {
    return authenticators
      .map((authenticator: Authenticator) => {
        const FormComponent = resolveSignInForm(authenticator.authType);
        if (!FormComponent) {
          return null;
        }
        const typeLabel = compileT(authenticator.authTypeTitle || authenticator.authType);
        return {
          key: authenticator.name,
          label: authenticator.title || `${t('Sign-in')} (${typeLabel})`,
          children: (
            <Suspense fallback={<Spin />}>
              <FormComponent authenticator={authenticator} />
            </Suspense>
          ),
        };
      })
      .filter(Boolean);
  }, [authenticators, resolveSignInForm, t, compileT]);

  const buttons = useMemo(() => {
    return authenticators
      .map((authenticator: Authenticator, index: number) => {
        const ButtonComponent = resolveSignInButton(authenticator.authType);
        if (!ButtonComponent) {
          return null;
        }
        return (
          <Suspense key={`${authenticator.name}-${index}`} fallback={<Spin />}>
            <ButtonComponent authenticator={authenticator} />
          </Suspense>
        );
      })
      .filter(Boolean);
  }, [authenticators, resolveSignInButton]);

  if (!authenticators.length) {
    return <Empty description={t('No authentication methods available.')} />;
  }

  return (
    <Space direction="vertical" style={{ display: 'flex' }}>
      {tabs.length > 1 ? <Tabs items={tabs as any} /> : tabs.length ? (tabs[0] as any).children : null}
      {buttons.length ? (
        <Space direction="vertical" style={{ display: 'flex' }}>
          {buttons}
        </Space>
      ) : null}
    </Space>
  );
}
