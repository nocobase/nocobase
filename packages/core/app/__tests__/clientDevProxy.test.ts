/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { isClientDevProxyPath, rewriteClientDevProxyRootPath } from '../clientDevProxy';

describe('client dev proxy', () => {
  it.each([
    ['/x', '/x/', true],
    ['/x/', '/x/', true],
    ['/x/test2/assets/index.js', '/x/', true],
    ['/x-other', '/x/', false],
    ['/console/v?from=portal', '/console/v/', true],
    ['/v', '/console/v/', false],
  ])('matches complete client base paths: %s', (url, basePath, expected) => {
    expect(isClientDevProxyPath(url, basePath)).toBe(expected);
  });

  it.each([
    ['/v', '/v/', '/v/'],
    ['/v?from=portal', '/v/', '/v/?from=portal'],
    ['/console/v#section', '/console/v/', '/console/v/#section'],
    ['/v/admin', '/v/', '/v/admin'],
    ['/v/', '/v/', '/v/'],
  ])('normalizes only a slashless client root: %s', (url, basePath, expected) => {
    expect(rewriteClientDevProxyRootPath(url, basePath)).toBe(expected);
  });
});
