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
  search?: string;
  hash?: string;
  modernClientPrefix?: string;
  appClientEntryMode?: string;
  scriptSrc?: string;
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
      __nocobase_modern_client_prefix__: input.modernClientPrefix,
      __nocobase_app_client_entry_mode__: input.appClientEntryMode,
      location: {
        origin: 'http://c.local.nocobase.com',
        pathname: input.pathname,
        search: input.search || '',
        hash: input.hash || '',
        replace,
      },
      console: consoleMock,
      outerWidth: 1280,
      outerHeight: 720,
      devicePixelRatio: 1,
      onresize: undefined,
    },
    document: {
      currentScript: {
        src:
          input.scriptSrc ||
          (scriptPath.includes('/app/client-v2/public/')
            ? 'http://assets.local.nocobase.com/v/browser-checker.js?v=1'
            : 'http://assets.local.nocobase.com/browser-checker.js?v=1'),
      },
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
      pathname: '/nocobase/console',
      publicPath: 'nocobase/console/',
    });

    expect(replace).toHaveBeenCalledWith('http://c.local.nocobase.com/nocobase/console/');
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
      pathname: '/nocobase/v/admin',
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

  if (scriptPath.includes('/app/client/public/')) {
    it('redirects app root to modern entry for modern-default', () => {
      const replace = executeBrowserChecker(scriptPath, {
        pathname: '/',
        publicPath: '/',
        modernClientPrefix: 'v',
        appClientEntryMode: 'modern-default',
      });

      expect(replace).toHaveBeenCalledWith('http://c.local.nocobase.com/v/');
    });

    it('redirects app root to modern entry for modern-only', () => {
      const replace = executeBrowserChecker(scriptPath, {
        pathname: '/',
        publicPath: '/',
        modernClientPrefix: 'v',
        appClientEntryMode: 'modern-only',
      });

      expect(replace).toHaveBeenCalledWith('http://c.local.nocobase.com/v/');
    });

    it('does not redirect legacy deep links for modern-default', () => {
      const replace = executeBrowserChecker(scriptPath, {
        pathname: '/admin',
        publicPath: '/',
        modernClientPrefix: 'v',
        appClientEntryMode: 'modern-default',
      });

      expect(replace).not.toHaveBeenCalled();
    });

    it('rewrites legacy document paths for modern-only', () => {
      const replace = executeBrowserChecker(scriptPath, {
        pathname: '/admin/settings/workflow',
        publicPath: '/',
        modernClientPrefix: 'v',
        appClientEntryMode: 'modern-only',
      });

      expect(replace).toHaveBeenCalledWith('http://c.local.nocobase.com/v/admin/settings/workflow');
    });

    it('redirects sub-path site root directly to final modern target', () => {
      const replace = executeBrowserChecker(scriptPath, {
        pathname: '/nocobase/',
        publicPath: '/nocobase/',
        modernClientPrefix: 'v',
        appClientEntryMode: 'modern-default',
      });

      expect(replace).toHaveBeenCalledWith('http://c.local.nocobase.com/nocobase/v/');
    });

    it('rewrites sub-app legacy deep links for modern-only without collapsing the sub-app segment', () => {
      const replace = executeBrowserChecker(scriptPath, {
        pathname: '/nocobase/apps/a_31itq60q4kg/admin/',
        publicPath: '/nocobase/',
        modernClientPrefix: 'v',
        appClientEntryMode: 'modern-only',
      });

      expect(replace).toHaveBeenCalledWith('http://c.local.nocobase.com/nocobase/v/apps/a_31itq60q4kg/admin');
    });
  }

  if (scriptPath.includes('/app/client-v2/public/')) {
    it.each([
      ['/v', 'http://c.local.nocobase.com/v/'],
      ['/v/', undefined],
    ])('normalizes the modern client root %s without redirecting to Settings', (pathname, expectedRedirect) => {
      const replace = executeBrowserChecker(scriptPath, {
        pathname,
        publicPath: '/v/',
        modernClientPrefix: 'v',
      });

      if (expectedRedirect) {
        expect(replace).toHaveBeenCalledOnce();
        expect(replace).toHaveBeenCalledWith(expectedRedirect);
      } else {
        expect(replace).not.toHaveBeenCalled();
      }
    });

    it.each(['/v/apps/demo', '/v/apps/demo/', '/v/_app/demo', '/v/_app/demo/'])(
      'lets the scoped modern client handle its root %s',
      (pathname) => {
        const replace = executeBrowserChecker(scriptPath, {
          pathname,
          publicPath: '/v/',
          modernClientPrefix: 'v',
        });

        expect(replace).not.toHaveBeenCalled();
      },
    );

    it.each([
      ['/settings/apps/demo', '/', '/settings/apps/demo/', 'v'],
      ['/settings/_app/demo', '/', '/settings/_app/demo/', 'v'],
      ['/nocobase/settings/apps/demo', '/nocobase/', '/nocobase/settings/apps/demo/', 'v'],
      ['/nocobase/settings/_app/demo', '/nocobase/', '/nocobase/settings/_app/demo/', 'v'],
      ['/tenant/apps/root/settings/apps/demo', '/tenant/apps/root/', '/tenant/apps/root/settings/apps/demo/', 'v'],
      ['/tenant/_app/root/settings/_app/demo', '/tenant/_app/root/', '/tenant/_app/root/settings/_app/demo/', 'v'],
      ['/tenant/v/settings/apps/demo', '/tenant/v/', '/tenant/v/settings/apps/demo/', 'v'],
      ['/tenant/modern/settings/_app/demo', '/tenant/modern/', '/tenant/modern/settings/_app/demo/', 'modern'],
    ])('normalizes the scoped Settings root %s to %s', (pathname, publicPath, expectedPathname, modernClientPrefix) => {
      const replace = executeBrowserChecker(scriptPath, {
        pathname,
        publicPath,
        modernClientPrefix,
        scriptSrc: 'https://cdn.example.com/ui/settings/browser-checker.js?v=1',
        search: '?tab=overview',
        hash: '#panel',
      });

      expect(replace).toHaveBeenCalledOnce();
      expect(replace).toHaveBeenCalledWith(`http://c.local.nocobase.com${expectedPathname}?tab=overview#panel`);
    });

    it.each([
      ['/tenant/apps/root/modern/apps/demo/', '/tenant/apps/root/modern/'],
      ['/tenant/_app/root/modern/_app/demo/', '/tenant/_app/root/modern/'],
    ])('lets the modern client handle %s under a nested public path', (pathname, publicPath) => {
      const replace = executeBrowserChecker(scriptPath, {
        pathname,
        publicPath,
        modernClientPrefix: 'modern',
        search: '?tab=overview',
        hash: '#panel',
      });

      expect(replace).not.toHaveBeenCalled();
    });

    it.each([
      ['/v/admin', '/v/'],
      ['/v/apps/demo/admin', '/v/'],
      ['/v/_app/demo/admin', '/v/'],
      ['/v/_apps/demo', '/v/'],
      ['/v/settings/apps/demo', '/v/'],
      ['/nocobase/modern/settings/_app/demo', '/nocobase/modern/', 'modern'],
    ])('does not redirect a non-root modern path %s to Settings', (pathname, publicPath, modernClientPrefix = 'v') => {
      const replace = executeBrowserChecker(scriptPath, {
        pathname,
        publicPath,
        modernClientPrefix,
      });

      expect(replace).not.toHaveBeenCalled();
    });

    it.each([
      ['/settings', '/'],
      ['/settings/', '/'],
      ['/settings/apps/demo/', '/'],
      ['/settings/_app/demo/', '/'],
      ['/settings/apps/demo/multi-portal', '/'],
      ['/settings/_app/demo/multi-portal', '/'],
      ['/settings/_apps/demo', '/'],
      ['/nocobase/settings/apps/demo/multi-portal', '/nocobase/'],
    ])('does not redirect a non-target Settings path %s', (pathname, publicPath) => {
      const replace = executeBrowserChecker(scriptPath, {
        pathname,
        publicPath,
        modernClientPrefix: 'v',
        scriptSrc: 'https://cdn.example.com/ui/settings/browser-checker.js?v=1',
      });

      expect(replace).not.toHaveBeenCalled();
    });
  }
});
