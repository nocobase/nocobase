/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const { resolve, posix } = require('path');
const {
  storagePathJoin,
  resolvePublicPath,
  resolveV2PublicPath,
  normalizeModernClientPrefix,
  resolveAppClientEntryMode,
} = require('../util');
const { readFileSync, writeFileSync } = require('fs');

function buildOtherLocation({ appPublicPath, v2PublicPath, modernClientPrefix, appClientEntryMode }) {
  if (appPublicPath === '/') {
    return '';
  }

  const appPublicPathWithoutTrailingSlash = appPublicPath.replace(/\/$/, '');
  const v2PublicPathWithoutTrailingSlash = v2PublicPath.replace(/\/$/, '');
  const siteRootTarget = appClientEntryMode === 'legacy-default' ? appPublicPath : v2PublicPath;
  const siteRootPrefixTargetBase =
    appClientEntryMode === 'modern-only' ? v2PublicPathWithoutTrailingSlash : appPublicPathWithoutTrailingSlash;
  const appRootRedirectLocations =
    appClientEntryMode === 'legacy-default'
      ? ''
      : `
    location = ${appPublicPathWithoutTrailingSlash} {
        return 302 ${v2PublicPath}$is_args$args;
    }

    location = ${appPublicPath} {
        return 302 ${v2PublicPath}$is_args$args;
    }`;

  // When the app is mounted under a sub-path, nginx owns the site root `/`
  // before the app shell is reached. We therefore resolve the site-root
  // entry in nginx first: legacy-default goes to APP_PUBLIC_PATH, while the
  // modern modes can jump directly to APP_PUBLIC_PATH + modern prefix.
  //
  // `location = /` is an exact match and does not conflict with the later
  // `location /` prefix rule; nginx evaluates the exact location first.
  //
  // Intentionally do NOT special-case `/index.html` here. Requests like
  // `/nocobase/apps/<subapp>/admin/` may fall back to `/index.html` through
  // `try_files`, and forcing a root-level `/index.html` redirect would
  // incorrectly collapse those sub-app deep links into the main app entry.
  return `${appRootRedirectLocations}
    location = /${modernClientPrefix} {
        return 302 ${v2PublicPath}$is_args$args;
    }

    location /${modernClientPrefix}/ {
        return 302 ${appPublicPathWithoutTrailingSlash}$uri$is_args$args;
    }

    location = / {
        return 302 ${siteRootTarget}$is_args$args;
    }

    location / {
        return 302 ${siteRootPrefixTargetBase}$uri$is_args$args;
    }`;
}

/**
 *
 * @param {Command} cli
 */
module.exports = (cli) => {
  cli.command('create-nginx-conf').action(async (name, options) => {
    const rawAppPublicPath = process.env.APP_PUBLIC_PATH || '/';
    const appPublicPath = resolvePublicPath(rawAppPublicPath);
    const distPath = `${appPublicPath.replace(/\/$/, '')}/dist/`;
    const v2PublicPath = resolveV2PublicPath(rawAppPublicPath);
    const v2PublicPathNoTrailingSlash = v2PublicPath.replace(/\/$/, '');
    const modernClientPrefix = normalizeModernClientPrefix(process.env.APP_MODERN_CLIENT_PREFIX);
    const appClientEntryMode = resolveAppClientEntryMode();
    const file = resolve(__dirname, '../../nocobase.conf.tpl');
    const data = readFileSync(file, 'utf-8');
    const otherLocation = buildOtherLocation({
      appPublicPath,
      v2PublicPath,
      modernClientPrefix,
      appClientEntryMode,
    });
    const replaced = data
      .replace(/\{\{cwd\}\}/g, posix.resolve(process.cwd()))
      .replace(/\{\{publicPath\}\}/g, appPublicPath)
      .replace(/\{\{distPath\}\}/g, distPath)
      .replace(/\{\{v2PublicPath\}\}/g, v2PublicPath)
      .replace(/\{\{v2PublicPathNoTrailingSlash\}\}/g, v2PublicPathNoTrailingSlash)
      .replace(/\{\{apiPort\}\}/g, process.env.APP_PORT)
      .replace(/\{\{otherLocation\}\}/g, otherLocation);
    const targetFile = storagePathJoin('nocobase.conf');
    writeFileSync(targetFile, replaced);
  });
};

module.exports._test = {
  buildOtherLocation,
};
