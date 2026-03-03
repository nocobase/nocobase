/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { isURL } from '@nocobase/utils/client';

// 补全 URL
export function completeURL(url: string, origin = window.location.origin) {
  if (!url) {
    return '';
  }
  if (isURL(url)) {
    return url;
  }
  return url.startsWith('/') ? `${origin}${url}` : `${origin}/${url}`;
}

export function handleLinkNavigation(options: {
  link: string;
  openInNewWindow?: boolean;
  router: { navigate: (to: string, options?: { replace?: boolean }) => void };
  isExternalLink: boolean;
  setLocationHref?: (url: string) => void;
  openWindow?: (url?: string, target?: string) => Window | null;
}) {
  const { link, openInNewWindow, router, isExternalLink } = options;
  const setLocationHref = options.setLocationHref ?? ((url: string) => (window.location.href = url));
  const openWindow = options.openWindow ?? ((url?: string, target?: string) => window.open(url, target));

  if (openInNewWindow) {
    openWindow(completeURL(link), '_blank');
    return;
  }

  if (isExternalLink) {
    setLocationHref(link);
    return;
  }

  // Link 按钮只负责导航，不应在导航后主动关闭当前弹窗视图；
  // 否则在弹窗上下文中会把新路由回滚为关闭弹窗后的原页面。
  router.navigate(link, { replace: true });
}
