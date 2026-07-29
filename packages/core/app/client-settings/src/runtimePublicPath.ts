/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

function normalizeBasePath(value: string | undefined, fallback: string) {
  const normalized = String(value || fallback)
    .trim()
    .replace(/\/+$/, '');
  return normalized || fallback.replace(/\/+$/, '');
}

export function resolveSettingsAssetPublicPath(cdnBaseUrl: string | undefined, appPublicPath: string) {
  const basePath = cdnBaseUrl?.trim() ? normalizeBasePath(cdnBaseUrl, '/') : normalizeBasePath(appPublicPath, '/');

  return `${basePath}/settings/`.replace(/^\/\//, '/');
}
