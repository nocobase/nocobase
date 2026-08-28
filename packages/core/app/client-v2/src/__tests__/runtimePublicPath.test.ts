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
  it('should append the fixed build asset directory to the CDN base URL', () => {
    expect(resolveRuntimeAssetPublicPath('https://cdn.nocobase.com/dist/2.1.22/', '/v/', 'v')).toBe(
      'https://cdn.nocobase.com/dist/2.1.22/v/',
    );
  });

  it('should use the modern client public path when the CDN base URL is empty', () => {
    expect(resolveRuntimeAssetPublicPath('', '/v/', 'v')).toBe('/v/');
  });

  it('should use APP_PUBLIC_PATH plus the runtime modern prefix when the CDN base URL is empty', () => {
    expect(resolveRuntimeAssetPublicPath('', '/custom-base/modern/', 'v')).toBe('/custom-base/modern/');
  });
});
