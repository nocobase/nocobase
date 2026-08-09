/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-env jest */

const fs = require('fs-extra');
const os = require('os');
const path = require('path');

const registerCreateNginxConf = require('../commands/create-nginx-conf');

describe('create-nginx-conf routing', () => {
  const originalEnv = { ...process.env };
  let storagePath;

  afterEach(async () => {
    process.env = { ...originalEnv };
    if (storagePath) {
      await fs.remove(storagePath);
      storagePath = undefined;
    }
  });

  async function renderConfig(appPublicPath) {
    storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'nocobase-nginx-settings-'));
    process.env.APP_PUBLIC_PATH = appPublicPath;
    process.env.APP_MODERN_CLIENT_PREFIX = 'v';
    process.env.APP_PORT = '13000';
    process.env.STORAGE_PATH = storagePath;

    let action;
    registerCreateNginxConf({
      command() {
        return {
          action(callback) {
            action = callback;
          },
        };
      },
    });
    await action();
    return await fs.readFile(path.join(storagePath, 'nocobase.conf'), 'utf8');
  }

  test.each([
    ['root mount', '/', '/settings/assets/', '^/settings(?:/|$)'],
    ['custom public path', '/nocobase/', '/nocobase/settings/assets/', '^/nocobase/settings(?:/|$)'],
  ])(
    'proxies Settings documents and caches Settings assets for %s',
    async (_label, publicPath, assetsPath, routePattern) => {
      const config = await renderConfig(publicPath);

      expect(config).toContain(`location ^~ ${assetsPath} {`);
      expect(config).toContain('dist/client/settings/assets/;');
      expect(config).toContain('expires 365d;');
      expect(config).toContain(`location ~ ${routePattern} {`);
      expect(config).toContain('proxy_pass http://127.0.0.1:13000;');
      expect(config).not.toContain('location ~ ^/admin/settings');
      expect(config).toContain('try_files $uri $uri/ /index.html;');
    },
  );

  test.each([
    ['root mount', '/', '/x', '/v/'],
    ['custom public path', '/nocobase/', '/nocobase/x', '/nocobase/v/'],
  ])('redirects Portal roots to the Modern Client for %s', async (_label, publicPath, portalRoot, modernRoot) => {
    const config = await renderConfig(publicPath);

    expect(config).toContain(`location = ${portalRoot} {
        absolute_redirect off;
        return 302 ${modernRoot}$is_args$args;
    }`);
    expect(config).toContain(`location = ${portalRoot}/ {
        absolute_redirect off;
        return 302 ${modernRoot}$is_args$args;
    }`);
    expect(config).toContain(`return 302 ${modernRoot}$is_args$args;`);
    expect(config).toContain(`if ($uri ~ ^${portalRoot}/apps/(?<subapp>[A-Za-z0-9_-]+)/?$) {`);
    expect(config).toContain(`return 302 ${modernRoot}apps/$subapp/$is_args$args;`);
    expect(config).toContain('rewrite ^ /portals/$subapp/$portal/dist/client/index.html break;');
    expect(config).toContain('/portals/$subapp/$portal/dist/client/$portal_path');
    expect(config).toContain('/portals/main/$portal/dist/client/$portal_path');
  });
});
