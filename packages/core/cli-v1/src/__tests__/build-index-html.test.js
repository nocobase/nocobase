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
const { buildIndexHtml } = require('../util');

function createAppPackageRoot() {
  const appRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-app-html-'));
  const clientDir = path.join(appRoot, 'dist/client');
  fs.ensureDirSync(clientDir);
  fs.writeFileSync(path.join(clientDir, 'index.html'), '<html></html>', 'utf-8');
  fs.writeFileSync(
    path.join(clientDir, 'index.html.tpl'),
    [
      "window['__nocobase_app_dev__'] = {{env.NOCOBASE_APP_DEV}};",
      "window['__nocobase_public_path__'] = '{{env.APP_PUBLIC_PATH}}';",
    ].join('\n'),
    'utf-8',
  );
  return appRoot;
}

describe('cli-v1 buildIndexHtml', () => {
  const originalArgv = process.argv.slice();
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.argv = originalArgv.slice();
    process.env = { ...originalEnv };
  });

  test('marks app-dev HTML when running the app-dev command before child env is injected', () => {
    const appRoot = createAppPackageRoot();
    process.argv = ['node', 'nocobase-v1', 'app-dev'];
    process.env.APP_PACKAGE_ROOT = appRoot;
    process.env.APP_PUBLIC_PATH = '/';
    process.env.NOCOBASE_APP_DEV = '';

    buildIndexHtml();

    const html = fs.readFileSync(path.join(appRoot, 'dist/client/index.html'), 'utf-8');
    expect(html).toContain("window['__nocobase_app_dev__'] = true;");
    fs.removeSync(appRoot);
  });

  test('marks app-dev HTML when running a child command with app-dev env', () => {
    const appRoot = createAppPackageRoot();
    process.argv = ['node', 'nocobase-v1', 'start'];
    process.env.APP_PACKAGE_ROOT = appRoot;
    process.env.APP_PUBLIC_PATH = '/';
    process.env.NOCOBASE_APP_DEV = 'true';

    buildIndexHtml();

    const html = fs.readFileSync(path.join(appRoot, 'dist/client/index.html'), 'utf-8');
    expect(html).toContain("window['__nocobase_app_dev__'] = true;");
    fs.removeSync(appRoot);
  });

  test('does not mark normal start HTML as app-dev', () => {
    const appRoot = createAppPackageRoot();
    process.argv = ['node', 'nocobase-v1', 'start'];
    process.env.APP_PACKAGE_ROOT = appRoot;
    process.env.APP_PUBLIC_PATH = '/';
    process.env.NOCOBASE_APP_DEV = '';

    buildIndexHtml();

    const html = fs.readFileSync(path.join(appRoot, 'dist/client/index.html'), 'utf-8');
    expect(html).toContain("window['__nocobase_app_dev__'] = false;");
    fs.removeSync(appRoot);
  });
});
