/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';

describe('flow-model save', () => {
  let app: MockServer;
  let agent: any;

  afterEach(async () => {
    await app.destroy();
  });

  beforeEach(async () => {
    app = await createMockServer({
      registerActions: true,
      plugins: ['flow-engine'],
    });
    agent = app.agent();
  });

  it('should return model by default', async () => {
    const res = await agent.resource('flowModels').save({
      values: { uid: 'save-default-1', use: 'RouteModel', async: false },
    });
    expect(res.status).toBe(200);
    expect(res.body?.data?.uid).toBe('save-default-1');
    expect(res.body?.data?.use).toBe('RouteModel');
  });

  it('should return uid when return=uid', async () => {
    const res = await agent.resource('flowModels').save({
      return: 'uid',
      values: { uid: 'save-uid-1', use: 'RouteModel', async: false },
    });
    expect(res.status).toBe(200);
    expect(res.body?.data).toBe('save-uid-1');
  });
});
