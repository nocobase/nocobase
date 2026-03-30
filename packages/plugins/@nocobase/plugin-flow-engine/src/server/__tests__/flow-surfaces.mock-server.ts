/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { FLOW_SURFACES_TEST_PLUGINS } from './flow-surfaces.test-plugins';

export async function createFlowSurfacesMockServer() {
  return createMockServer({
    registerActions: true,
    acl: true,
    plugins: [...FLOW_SURFACES_TEST_PLUGINS],
    beforeInstall: async (app) => {
      await app.cleanDb();
    },
  });
}

export async function loginFlowSurfacesRootAgent(app: MockServer) {
  const rootUser = await app.db.getRepository('users').findOne({
    filter: {
      'roles.name': 'root',
    },
  });

  return app.agent().login(rootUser);
}
