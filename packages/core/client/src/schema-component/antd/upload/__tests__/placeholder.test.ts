/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getUploadPlaceholderUrl } from '../placeholder';

describe('getUploadPlaceholderUrl', () => {
  it('uses APP_PUBLIC_PATH instead of the root development asset path', () => {
    expect(
      getUploadPlaceholderUrl('/file-placeholder/pdf-200-200.png', {
        __webpack_public_path__: '/',
        __nocobase_public_path__: '/nocobase/',
      }),
    ).toBe('/nocobase/file-placeholder/pdf-200-200.png');
  });

  it('uses the versioned asset path when configured', () => {
    expect(
      getUploadPlaceholderUrl('/file-placeholder/pdf-200-200.png', {
        __webpack_public_path__: '/nocobase/dist/2.1.21/',
        __nocobase_public_path__: '/nocobase/',
      }),
    ).toBe('/nocobase/dist/2.1.21/file-placeholder/pdf-200-200.png');
  });
});
