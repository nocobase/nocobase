/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { resolveRuntimeAssetPublicPath } from '../runtimePublicPath';

describe('resolveRuntimeAssetPublicPath', () => {
  it('should prefer the injected window public path over an auto-detected runtime path', () => {
    expect(resolveRuntimeAssetPublicPath('/dist/2.1.8/', '/', 'https://static.cloudflareinsights.com/assets/../')).toBe(
      '/dist/2.1.8/',
    );
  });

  it('should use the app public path when the CDN base URL is empty', () => {
    expect(resolveRuntimeAssetPublicPath('', '/', 'https://static.cloudflareinsights.com/assets/../')).toBe('/');
  });

  it('should use the configured APP_PUBLIC_PATH when the CDN base URL is empty', () => {
    expect(resolveRuntimeAssetPublicPath('', '/custom-base/', 'https://static.cloudflareinsights.com/assets/../')).toBe(
      '/custom-base/',
    );
  });

  it('should fall back to the runtime public path when the injected paths are missing', () => {
    expect(resolveRuntimeAssetPublicPath(undefined, undefined, 'https://cdn.nocobase.com/dist/2.1.8/')).toBe(
      'https://cdn.nocobase.com/dist/2.1.8/',
    );
  });
});
