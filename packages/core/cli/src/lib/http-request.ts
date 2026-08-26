/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

function normalizeLocationUrl(location: string, currentUrl: string) {
  try {
    return new URL(location, currentUrl).toString();
  } catch (_error) {
    return undefined;
  }
}

function shouldPreserveAuthorizationRedirect(fromUrl: string, toUrl: string) {
  try {
    const from = new URL(fromUrl);
    const to = new URL(toUrl);
    return (
      from.hostname === to.hostname &&
      from.port === to.port &&
      from.pathname === to.pathname &&
      from.search === to.search &&
      from.protocol === 'http:' &&
      to.protocol === 'https:'
    );
  } catch (_error) {
    return false;
  }
}

export async function fetchWithPreservedAuthRedirect(
  url: string,
  init: RequestInit = {},
) {
  const response = await fetch(url, {
    ...init,
    redirect: 'manual',
  });

  const location = response.headers.get('location');
  if (!location || ![301, 302, 307, 308].includes(response.status)) {
    return response;
  }

  const nextUrl = normalizeLocationUrl(location, url);
  if (!nextUrl || !shouldPreserveAuthorizationRedirect(url, nextUrl)) {
    return response;
  }

  return fetch(nextUrl, {
    ...init,
    redirect: 'manual',
  });
}
