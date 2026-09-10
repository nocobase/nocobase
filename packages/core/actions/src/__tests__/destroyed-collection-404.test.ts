/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { registerActions } from '@nocobase/actions';
import { mockServer, MockServer } from './index';

describe('destroyed collection', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = mockServer();
    registerActions(app);

    app.collection({
      name: 'tcdestroy',
      fields: [{ type: 'string', name: 'name' }],
    });

    await app.db.sync();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('answers 404 for a list request once the collection is destroyed', async () => {
    const before = await app.agent().resource('tcdestroy').list();
    expect(before.status).toBe(200);

    app.db.removeCollection('tcdestroy');

    const response = await app.agent().resource('tcdestroy').list();
    expect(response.status).toBe(404);
  });

  it('answers 404 for a get request once the collection is destroyed', async () => {
    const before = await app.agent().resource('tcdestroy').list();
    expect(before.status).toBe(200);

    app.db.removeCollection('tcdestroy');

    const response = await app.agent().resource('tcdestroy').get({ filterByTk: 1 });
    expect(response.status).toBe(404);
  });

  it('answers 404 for a create request once the collection is destroyed', async () => {
    app.db.removeCollection('tcdestroy');

    const response = await app.agent().resource('tcdestroy').create({ values: { name: 'x' } });
    expect(response.status).toBe(404);
  });

  it('still answers 404 for a collection that never existed', async () => {
    const response = await app.agent().resource('tcneverexisted').list();
    expect(response.status).toBe(404);
  });
});
