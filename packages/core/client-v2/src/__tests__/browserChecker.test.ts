/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

type BrowserCheckerCase = {
  pathname: string;
  publicPath: string;
  expectedRedirect?: string;
};

const testDir = path.dirname(fileURLToPath(import.meta.url));
const browserCheckerCases = [
  {
    label: 'v2 public browser-checker',
    scriptPath: path.resolve(testDir, '../../../app/client-v2/public/browser-checker.js'),
  },
  {
    label: 'v1 public browser-checker',
    scriptPath: path.resolve(testDir, '../../../app/client/public/browser-checker.js'),
  },
] as const;

function executeBrowserChecker(scriptPath: string, input: BrowserCheckerCase) {
  const replace = vi.fn();
  const consoleMock = {
    debug: vi.fn(),
    log: vi.fn(),
  };
  const context = {
    showLog: false,
    window: {
      __nocobase_public_path__: input.publicPath,
      location: {
        origin: 'http://c.local.nocobase.com',
        pathname: input.pathname,
        search: '',
        hash: '',
        replace,
      },
      console: consoleMock,
      outerWidth: 1280,
      outerHeight: 720,
      devicePixelRatio: 1,
      onresize: undefined,
    },
    document: {
      documentElement: {
        className: '',
        clientWidth: 1280,
        clientHeight: 720,
      },
    },
    navigator: {
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/126.0 Safari/537.36',
    },
    console: consoleMock,
  };

  vm.runInNewContext(readFileSync(scriptPath, 'utf8'), context, {
    filename: scriptPath,
  });

  return replace;
}

describe.each(browserCheckerCases)('$label', ({ scriptPath }) => {
  it('normalizes a relative public path before redirecting to the trailing-slash entry', () => {
    const replace = executeBrowserChecker(scriptPath, {
      pathname: '/nocobase/v',
      publicPath: 'nocobase/v/',
    });

    expect(replace).toHaveBeenCalledWith('http://c.local.nocobase.com/nocobase/v/');
  });

  it('prefixes outside paths with a root-relative basename instead of duplicating a relative segment', () => {
    const replace = executeBrowserChecker(scriptPath, {
      pathname: '/foo',
      publicPath: 'nocobase/v/',
    });

    expect(replace).toHaveBeenCalledWith('http://c.local.nocobase.com/nocobase/v/foo');
  });

  it('does not redirect when the current path is already under the normalized basename', () => {
    const replace = executeBrowserChecker(scriptPath, {
      pathname: '/nocobase/v/',
      publicPath: 'nocobase/v/',
    });

    expect(replace).not.toHaveBeenCalled();
  });

  it('does not redirect the root path when the normalized basename is also root', () => {
    const replace = executeBrowserChecker(scriptPath, {
      pathname: '/',
      publicPath: '/',
    });

    expect(replace).not.toHaveBeenCalled();
  });
});
