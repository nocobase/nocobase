/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/* eslint-env jest */

const docsCommand = require('../commands/docs');

const { getExistingConfigId, REWRITE_RULES } = docsCommand._test;
const timestamp = '20260818111000';

function rewritePath(path) {
  for (const rule of REWRITE_RULES) {
    const pattern = new RegExp(rule.sourceUrl);
    if (pattern.test(path)) {
      return path.replace(pattern, rule.targetTemplate(timestamp));
    }
  }
  return path;
}

describe('cli-v1 docs CDN rewrite rules', () => {
  test.each(['/api/ai', '/api/ai/', '/api/ai/chat', '/api/ai/assets/model.json'])(
    'keeps the AI API path unchanged: %s',
    (path) => {
      expect(rewritePath(path)).toBe(path);
    },
  );

  test('only excludes the exact AI API path prefix', () => {
    const path = '/api/aix';

    expect(rewritePath(path)).toBe(`/${timestamp}/api/aix/index.html`);
  });

  test('reuses existing config IDs when a rewrite pattern changes', () => {
    const existingConfigMap = {
      '^/en/([^.]*[^/.])$': 1,
      '^/([^.]*[^/.])/?$': 2,
      '^/en/(.*)': 3,
      '^/(.*)': 4,
    };

    expect(REWRITE_RULES.map((rule) => getExistingConfigId(existingConfigMap, rule))).toEqual([1, 2, 3, 4]);
  });

  test.each([
    ['/en/ai', `/${timestamp}/ai/index.html`],
    ['/en/ai/', `/${timestamp}/ai/index.html`],
    ['/cn', `/${timestamp}/cn/index.html`],
    ['/cn/', `/${timestamp}/cn/index.html`],
    ['/ja/ai', `/${timestamp}/ja/ai/index.html`],
    ['/ja/ai/', `/${timestamp}/ja/ai/index.html`],
  ])('rewrites extensionless documentation pages with or without a trailing slash: %s', (path, expected) => {
    expect(rewritePath(path)).toBe(expected);
  });

  test.each([
    ['/', `/${timestamp}/`],
    ['/static/app.js', `/${timestamp}/static/app.js`],
  ])('keeps root and static resources on the fallback rewrite: %s', (path, expected) => {
    expect(rewritePath(path)).toBe(expected);
  });
});
