/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer } from '@nocobase/test';

export async function createApp(options = {}) {
  const app = await createMockServer({
    acl: false,
    ...options,
    plugins: [
      'field-sort',
      'users',
      'error-handler',
      'data-source-main',
      'multi-app-manager',
      'multi-app-share-collection',
    ],
  });

  return app;
}
