/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SequelizeDataSource } from '@nocobase/data-source-manager';
import { createMockDatabase, createMockServer, MockServer } from '@nocobase/test';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('public form submission target', () => {
  let app: MockServer;
  let externalDb: Awaited<ReturnType<typeof createMockDatabase>>;
  const collection = { name: 'submissions', fields: [{ type: 'string', name: 'label' }] };

  beforeAll(async () => {
    app = await createMockServer({ acl: true, resourcer: { prefix: '/api/' }, plugins: ['public-forms'] });
    externalDb = await createMockDatabase({ tablePrefix: 'external_' });
    await app.db.collection(collection).sync();
    await externalDb.collection(collection).sync({ force: true });
    await app.dataSourceManager.add(
      new SequelizeDataSource({
        name: 'external',
        resourceManager: { prefix: '/api/' },
        collectionManager: { database: externalDb },
      }),
    );
  });

  afterAll(async () => {
    if (externalDb) {
      await externalDb.getCollection(collection.name).model.drop();
      await externalDb.close();
    }
    await app?.destroy();
  });

  async function issueFormToken(binding: string) {
    const form = await app.db.getRepository('publicForms').create({ values: { enabled: true, collection: binding } });
    const token = await app.authManager.jwt.sign({
      formKey: form.key,
      collectionName: 'submissions',
      targetCollections: [],
    });
    return { token, key: form.key as string };
  }

  it.each([
    ['external:submissions', 'external', 'main', 'publicSubmit'],
    ['external:submissions', 'external', 'main', 'create'],
    ['submissions', 'main', 'external', 'publicSubmit'],
  ])('binds %s to %s and rejects %s for %s', async (binding, allowed, denied, action) => {
    const { token, key } = await issueFormToken(binding);
    const submit = (source: string) =>
      app
        .agent()
        .post(`/api/submissions:${action}`)
        .set('X-Form-Token', token)
        .set('X-Data-Source', source)
        .send({ label: key });

    expect((await submit(allowed)).status).toBe(200);
    expect((await submit(denied)).status).toBe(403);
    const filter = { label: key };
    expect(await app.db.getRepository('submissions').count({ filter })).toBe(allowed === 'main' ? 1 : 0);
    expect(await externalDb.getRepository('submissions').count({ filter })).toBe(allowed === 'external' ? 1 : 0);
  });

  it('rejects a previously issued token for the original collection after a form is rebound', async () => {
    const { token, key } = await issueFormToken('main:submissions');
    await app.db.getRepository('publicForms').update({ filterByTk: key, values: { collection: 'main:archived' } });

    const response = await app
      .agent()
      .post('/api/submissions:publicSubmit')
      .set('X-Form-Token', token)
      .send({ label: key });

    expect(response.status).toBe(403);
    expect(await app.db.getRepository('submissions').count({ filter: { label: key } })).toBe(0);
  });
});
