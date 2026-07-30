/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const browserCheckerSource = readFileSync(resolve(__dirname, '../client-v2/public/browser-checker.js'), 'utf8');

interface RunBrowserCheckerOptions {
  appClientEntryMode?: string;
  currentScriptSrc?: string;
  hash?: string;
  modernPrefix?: string;
  pathname: string;
  publicPath?: string;
  search?: string;
}

function runBrowserChecker(options: RunBrowserCheckerOptions) {
  const replacements: string[] = [];
  const windowObject: Record<string, unknown> = {
    __nocobase_app_client_entry_mode__: options.appClientEntryMode,
    __nocobase_modern_client_prefix__: options.modernPrefix,
    __nocobase_public_path__: options.publicPath ?? '/v/',
    console: {
      log: () => undefined,
    },
    devicePixelRatio: 1,
    location: {
      hash: options.hash ?? '',
      origin: 'https://example.test',
      pathname: options.pathname,
      replace: (url: string) => replacements.push(url),
      search: options.search ?? '',
    },
    outerHeight: 720,
    outerWidth: 1280,
  };
  const documentElement = {
    className: 'no-js',
    clientHeight: 720,
    clientWidth: 1280,
  };

  vm.runInNewContext(browserCheckerSource, {
    console: {
      debug: () => undefined,
      log: () => undefined,
    },
    document: {
      currentScript: {
        src: options.currentScriptSrc ?? 'https://example.test/v/browser-checker.js',
      },
      documentElement,
    },
    navigator: {
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    window: windowObject,
  });

  return {
    className: documentElement.className,
    replacements,
  };
}

describe('v2 browser checker', () => {
  it.each([undefined, 'modern-default', 'modern-only'] as const)(
    'redirects the modern client root to Settings for entry mode %s',
    (appClientEntryMode) => {
      expect(
        runBrowserChecker({
          appClientEntryMode,
          pathname: '/v/',
        }).replacements,
      ).toEqual(['https://example.test/settings']);
    },
  );

  it.each([undefined, 'modern-default', 'modern-only'] as const)(
    'redirects scoped modern client roots to scoped Settings for entry mode %s',
    (appClientEntryMode) => {
      expect(
        runBrowserChecker({
          appClientEntryMode,
          pathname: '/v/apps/demo',
          search: '?from=admin',
          hash: '#portal',
        }).replacements,
      ).toEqual(['https://example.test/settings/apps/demo?from=admin#portal']);
    },
  );

  it('keeps Settings scoped trailing slash normalization independent from entry mode', () => {
    expect(
      runBrowserChecker({
        currentScriptSrc: 'https://example.test/settings/browser-checker.js',
        pathname: '/settings/apps/demo',
        publicPath: '/',
      }).replacements,
    ).toEqual(['https://example.test/settings/apps/demo/']);
  });
});
