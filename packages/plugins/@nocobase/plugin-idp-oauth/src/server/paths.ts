/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { normalizeBasePath } from './utils';

export type IdpOauthPaths = ReturnType<typeof createIdpOauthPaths>;

export function createIdpOauthPaths(apiBasePath = process.env.API_BASE_PATH || '/api') {
  const normalizedApiBasePath = normalizeBasePath(apiBasePath);
  const providerPathPrefix = `${normalizedApiBasePath}/idpOAuth/`;
  const interactionPathPrefix = `${providerPathPrefix}interaction/`;
  const oauthMetadataPath = `${normalizedApiBasePath}/.well-known/oauth-authorization-server`;
  const openidMetadataPath = `${normalizedApiBasePath}/.well-known/openid-configuration`;

  return {
    apiBasePath: normalizedApiBasePath,
    providerPathPrefix,
    interactionPathPrefix,
    oauthMetadataPath,
    openidMetadataPath,
    isProviderPath(path: string) {
      return path.startsWith(providerPathPrefix) || path === oauthMetadataPath || path === openidMetadataPath;
    },
    isDiscoveryPath(path: string) {
      return path === oauthMetadataPath || path === openidMetadataPath;
    },
  };
}

export function getProviderInternalPath(pathname: string, apiBasePath: string) {
  if (pathname.startsWith(`${apiBasePath}/`)) {
    return pathname.slice(apiBasePath.length) || '/';
  }

  return pathname;
}
