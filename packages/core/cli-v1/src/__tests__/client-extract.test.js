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
const { renderExtractedClientIndexHtml } = require('../commands/client');

describe('cli-v1 client:extract', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('renders extracted root index with the current client entry mode', () => {
    const target = fs.mkdtempSync(path.join(os.tmpdir(), 'nocobase-client-extract-'));
    fs.writeFileSync(
      path.join(target, 'index.html.tpl'),
      [
        '<html><head>',
        "<script>window['__webpack_public_path__'] = '{{env.CDN_BASE_URL}}';",
        "window['__nocobase_public_path__'] = '{{env.APP_PUBLIC_PATH}}';",
        "window['__nocobase_modern_client_prefix__'] = '{{env.APP_MODERN_CLIENT_PREFIX}}';",
        "window['__nocobase_app_client_entry_mode__'] = '{{env.APP_CLIENT_ENTRY_MODE}}';</script>",
        '<script src="{{env.APP_PUBLIC_PATH}}browser-checker.js?v=1"></script>',
        '<script type="module" src="assets/runtime.js"></script>',
        '</head><body></body></html>',
      ].join(''),
      'utf-8',
    );

    process.env.APP_PUBLIC_PATH = '/';
    process.env.APP_MODERN_CLIENT_PREFIX = 'v';
    process.env.APP_CLIENT_ENTRY_MODE = 'modern-only';
    delete process.env.CDN_BASE_URL;

    expect(renderExtractedClientIndexHtml(target, '2.2.0-beta.15')).toBe(true);

    const html = fs.readFileSync(path.join(target, 'index.html'), 'utf-8');
    expect(html).toContain("window['__nocobase_app_client_entry_mode__'] = 'modern-only';");
    expect(html).toContain("window['__webpack_public_path__'] = '/dist/2.2.0-beta.15/';");
    expect(html).toContain('src="/dist/2.2.0-beta.15/browser-checker.js?v=1"');
    expect(html).toContain('src="/dist/2.2.0-beta.15/assets/runtime.js"');
    fs.removeSync(target);
  });
});
