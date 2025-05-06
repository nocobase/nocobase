/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';

export async function prepareApp(): Promise<MockServer> {
  const app = await createMockServer({
    registerActions: true,
    acl: true,
    plugins: [
      'acl',
      'error-handler',
      'field-sort',
      'users',
      'ui-schema-storage',
      'data-source-main',
      'auth',
      'data-source-manager',
      'collection-tree',
      'system-settings',
    ],
  });

  return app;
}
