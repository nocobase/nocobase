/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function resolvePublicPath(appPublicPath = '/') {
  const normalized = String(appPublicPath || '/').trim() || '/';
  const withLeadingSlash = normalized.startsWith('/') ? normalized : `/${normalized}`;
  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

export function resolveV2PublicPath(appPublicPath = '/') {
  const publicPath = resolvePublicPath(appPublicPath);
  return `${publicPath.replace(/\/$/, '')}/v2/`;
}

function ensureTrailingSlash(value: string) {
  return value.endsWith('/') ? value : `${value}/`;
}

export function rewriteV2AssetPublicPath(html: string, assetPublicPath: string) {
  const normalizedAssetPublicPath = ensureTrailingSlash(assetPublicPath);
  if (normalizedAssetPublicPath === '/v2/') {
    return html;
  }

  return html.replace(/((?:src|href)=["'])\/v2\//g, `$1${normalizedAssetPublicPath}`);
}

export function injectRuntimeScript(html: string, runtimeScript: string) {
  const browserCheckerScriptMatch = html.match(/<script\b[^>]*browser-checker\.js[^>]*><\/script>/i);

  if (browserCheckerScriptMatch?.[0]) {
    return html.replace(browserCheckerScriptMatch[0], `${runtimeScript}\n${browserCheckerScriptMatch[0]}`);
  }

  const moduleScriptMatch = html.match(/<script\b[^>]*type=["']module["'][^>]*>/i);

  if (moduleScriptMatch?.[0]) {
    return html.replace(moduleScriptMatch[0], `${runtimeScript}\n${moduleScriptMatch[0]}`);
  }

  if (html.includes('</head>')) {
    return html.replace('</head>', `${runtimeScript}\n</head>`);
  }

  return `${runtimeScript}\n${html}`;
}
