/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-env jest */

const { buildOtherLocation } = require('../commands/create-nginx-conf')._test;

describe('cli-v1 create-nginx-conf', () => {
  test('does not redirect app public path index.html in modern modes', () => {
    const rendered = buildOtherLocation({
      appPublicPath: '/nocobase/',
      v2PublicPath: '/nocobase/v/',
      modernClientPrefix: 'v',
      appClientEntryMode: 'modern-only',
    });

    expect(rendered).not.toContain('location = /nocobase/index.html');
    expect(rendered).not.toContain('location = /index.html');
  });

  test('keeps site root redirect while leaving sub-app deep links to try_files/browser routing', () => {
    const rendered = buildOtherLocation({
      appPublicPath: '/nocobase/',
      v2PublicPath: '/nocobase/v/',
      modernClientPrefix: 'v',
      appClientEntryMode: 'modern-only',
    });

    expect(rendered).toContain('location = / {\n        return 302 /nocobase/v/$is_args$args;');
    expect(rendered).toContain('location / {\n        return 302 /nocobase/v$uri$is_args$args;');
  });
});
