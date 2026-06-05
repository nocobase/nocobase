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

  // 该辅助方法仅负责导航，是否关闭弹窗由调用方按场景决定；
  // 在弹窗上下文中，错误的关闭时机会把新路由回滚为原页面。
  router.navigate(link, { replace: true });
}

/**
 * 判断 Link 导航后是否需要销毁当前视图
 * @param options 判定参数
 * @param options.openInNewWindow 是否新窗口打开
 * @param options.isExternalLink 是否外部链接
 * @param options.viewType 当前视图类型
 * @returns 是否应销毁当前视图
 */
export function shouldDestroyViewAfterLinkNavigation(options: {
  openInNewWindow?: boolean;
  isExternalLink: boolean;
  viewType?: string;
}) {
  const { openInNewWindow, isExternalLink, viewType } = options;
  return !openInNewWindow && !isExternalLink && viewType !== 'embed';
}
