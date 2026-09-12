/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

function normalizePublicPath(value: string, fallback: string) {
  let normalized = value.trim() || fallback;
  if (!normalized.endsWith('/')) {
    normalized = `${normalized}/`;
  }
  return normalized;
}

export function resolveRuntimeAssetPublicPath(
  cdnPublicPath: string | undefined,
  appPublicPath: string,
  buildAssetDir: string,
) {
  const normalizedAppPublicPath = normalizePublicPath(appPublicPath, '/');
  const normalizedCdnPublicPath = cdnPublicPath?.trim();
  if (!normalizedCdnPublicPath) {
    return normalizedAppPublicPath;
  }

  const normalizedBuildAssetDir = buildAssetDir.replace(/^\/+|\/+$/g, '');
  return normalizePublicPath(
    `${normalizedCdnPublicPath.replace(/\/+$/, '')}/${normalizedBuildAssetDir}/`,
    normalizedAppPublicPath,
  );
}
