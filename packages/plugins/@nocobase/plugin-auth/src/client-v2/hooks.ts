/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '@nocobase/client-v2';

/**
 * 把 `?redirect=` 上带 modern client basename 的目标(例如 `/nocobase/v/admin`)规约成
 * react-router 接受的、相对 basename 的路径(`/admin`)。如果 target 已经是相对路径(不带
 * basename, 例如服务端 2FA 中间件返回的 `/admin`),原样返回——react-router `navigate` 会自动
 * 加上 basename。
 */
function stripV2Basename(target: string, basename?: string): string {
  if (!basename || basename === '/') {
    return target.startsWith('/') ? target : `/${target}`;
  }
  const normalized = basename.endsWith('/') ? basename.slice(0, -1) : basename;
  if (target === normalized) {
    return '/';
  }
  if (target.startsWith(`${normalized}/`)) {
    return target.slice(normalized.length) || '/';
  }
  // target 不在 modern client basename 下,当作相对路径,交给 react-router 自动 prepend basename。
  return target;
}

function shouldUseDocumentRedirect(app: ReturnType<typeof useApp>, target: string) {
  const matches = app.router.matchRoutes(target) || [];
  return matches.length === 0 || matches.every((match) => match.route.id === 'not-found');
}

export function useRedirect(next = '/admin') {
  const app = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  return useCallback(() => {
    const redirect = searchParams.get('redirect');
    const target = redirect || next;
    const basename = app.router.getBasename?.();
    if (shouldUseDocumentRedirect(app, target)) {
      window.location.replace(target);
      return;
    }
    navigate(stripV2Basename(target, basename), { replace: true });
  }, [app, navigate, next, searchParams]);
}

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

export function useSignIn(authenticator: string) {
  const app = useApp();
  const redirect = useRedirect();

  return {
    async run(values: Record<string, any>) {
      await app.apiClient.auth.signIn(values, authenticator);
      // v1 在 signIn 之后会 `await refreshAsync()` 触发 `/auth:check`。表面上是刷新用户信息,
      // 实际更关键的副作用:借这次网络往返让出 JS 任务,给浏览器机会提交其它响应拦截器(例如
      // plugin-two-factor-authentication 收到 `code:302` 时)排队的 `window.location.href`
      // 整页跳转。如果不等,下面 `redirect()` 会同步 react-router `navigate`,虽然不会覆盖
      // `location.href`,但会让目标页(例如 /admin)闪现一下才被整页跳转替换。复用同款手法。
      await app.apiClient
        .request({
          url: '/auth:check',
          skipAuth: true,
          skipNotify: true,
        })
        .catch(() => undefined);
      redirect();
    },
  };
}
