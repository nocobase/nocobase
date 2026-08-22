/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

const { resolve, posix } = require('path');
const { storagePathJoin, resolvePublicPath, resolveV2PublicPath, normalizeModernClientPrefix } = require('../util');
const { readFileSync, writeFileSync } = require('fs');

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
    const modernClientPrefix = normalizeModernClientPrefix(process.env.APP_MODERN_CLIENT_PREFIX);
    const appPublicPathWithoutTrailingSlash = appPublicPath.replace(/\/$/, '');
    const v2PublicPathWithoutTrailingSlash = v2PublicPath.replace(/\/$/, '');
    const file = resolve(__dirname, '../../nocobase.conf.tpl');
    const data = readFileSync(file, 'utf-8');
    let otherLocation = '';
    if (appPublicPath !== '/') {
      // When the app is mounted under a sub-path, redirect the root-level
      // `/<prefix>` and `/<prefix>/` to the real (sub-path-prefixed) location.
      otherLocation = `location = /${modernClientPrefix} {
        return 302 ${v2PublicPath}$is_args$args;
    }

    location /${modernClientPrefix}/ {
        return 302 ${appPublicPathWithoutTrailingSlash}$uri$is_args$args;
    }

    location ^~ /files/ {
        proxy_pass http://127.0.0.1:${process.env.APP_PORT};
        proxy_http_version 1.1;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $upstream_x_forwarded_proto;
        proxy_set_header Host $final_host;
        proxy_set_header Referer $http_referer;
        proxy_set_header User-Agent $http_user_agent;
        add_header Cache-Control 'no-cache, no-store';
        proxy_connect_timeout 600;
        proxy_send_timeout 600;
        proxy_read_timeout 600;
        send_timeout 600;
    }

    location / {
        alias ${posix.resolve(process.cwd())}/node_modules/@nocobase/app/dist/client/;
        try_files $uri $uri/ /index.html;
    }`;
    }
    const replaced = data
      .replace(/\{\{cwd\}\}/g, posix.resolve(process.cwd()))
      .replace(/\{\{publicPath\}\}/g, appPublicPath)
      .replace(/\{\{distPath\}\}/g, distPath)
      .replace(/\{\{v2PublicPath\}\}/g, v2PublicPath)
      .replace(/\{\{v2PublicPathNoTrailingSlash\}\}/g, v2PublicPathWithoutTrailingSlash)
      .replace(/\{\{apiPort\}\}/g, process.env.APP_PORT)
      .replace(/\{\{otherLocation\}\}/g, otherLocation);
    const targetFile = storagePathJoin('nocobase.conf');
    writeFileSync(targetFile, replaced);
  });
};
