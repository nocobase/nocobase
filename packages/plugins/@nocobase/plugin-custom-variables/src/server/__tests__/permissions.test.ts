/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';

describe('custom variable permissions', () => {
  let app: MockServer;

  beforeAll(async () => {
    app = await createMockServer({
      acl: true,
      plugins: ['acl', 'field-sort', 'users', 'auth', 'data-source-manager', 'custom-variables'],
    });
  });

  afterAll(async () => {
    await app.destroy();
  });

  it('requires interface configuration permission to manage variables and lets members use them', async () => {
    await app.db.getRepository('roles').create({ values: { name: 'designer', snippets: ['ui.*'] } });
    await app.db.getRepository('roles').update({
      filterByTk: 'member',
      values: { strategy: { actions: ['view', 'create', 'update', 'destroy'] } },
    });
    const users = app.db.getRepository('users');
    const designer = await users.create({ values: { roles: ['designer'] } });
    const member = await users.create({ values: { roles: ['member'] } });
    const designerAgent = await app.agent().login(designer);
    const memberAgent = await app.agent().login(member);
    const designerVariables = designerAgent.resource('customVariables');
    const memberVariables = memberAgent.resource('customVariables');
    const values = {
      name: 'variableCount',
      label: 'Variable count',
      declaredAt: 'test-block',
      type: 'aggregate',
      options: { collection: 'customVariables', aggregator: 'count', params: { field: 'name' } },
    };
    const filterByTk = values.name;

    expect((await memberVariables.create({ values })).status).toBe(403);
    expect((await designerVariables.create({ values })).status).toBe(200);
    expect((await memberVariables.update({ filterByTk, values: { label: 'Member edit' } })).status).toBe(403);
    expect((await memberVariables.destroy({ filterByTk })).status).toBe(403);
    const upsert = { filterKeys: ['name'], values: { ...values, label: 'Member edit' } };
    expect((await memberVariables.updateOrCreate(upsert)).status).toBe(403);
    expect((await memberVariables.firstOrCreate({ ...upsert, values: { ...values, name: 'another' } })).status).toBe(
      403,
    );
    expect((await memberVariables.list()).status).toBe(200);
    const record = await memberVariables.get({ filterByTk });
    expect(record.body.data.label).toBe(values.label);
    const result = await memberAgent
      .post('/customVariables:parse')
      .query({ name: values.name })
      .send({ filterCtx: {} });
    expect(result.status).toBe(200);
    expect(result.body.data).toBe(1);

    expect((await designerVariables.update({ filterByTk, values: { label: 'Designer edit' } })).status).toBe(200);
    expect((await memberVariables.get({ filterByTk })).body.data.label).toBe('Designer edit');
    expect((await designerVariables.destroy({ filterByTk })).status).toBe(200);
    expect(await app.db.getRepository('customVariables').count()).toBe(0);
  });
});
