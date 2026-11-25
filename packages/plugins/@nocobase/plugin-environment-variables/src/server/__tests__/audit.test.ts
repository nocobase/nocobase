/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { AuditLog } from '@nocobase/server';
import { createMockServer, MockServer } from '@nocobase/test';

describe('environment variable audit metadata', () => {
  let app: MockServer;
  let logs: AuditLog[];

  beforeAll(async () => {
    app = await createMockServer({ plugins: ['error-handler', 'environment-variables'] });
    for (const name of ['create', 'update', 'firstOrCreate', 'updateOrCreate']) {
      app.auditManager.registerAction({
        name,
        getSourceAndTarget: async (ctx) => ({
          targetCollection: ctx.action.resourceName,
          targetRecordUK: ctx.action.params.filterByTk || ctx.body?.data?.name,
        }),
      });
    }
    app.auditManager.setLogger({
      log: async (log) => {
        logs.push(log);
      },
    });
  });

  beforeEach(() => {
    logs = [];
  });

  afterAll(async () => {
    await app.destroy();
  });

  it('preserves the variable and audit target when creating and updating a secret', async () => {
    const name = 'AUDIT_SECRET';
    const created = await app
      .agent()
      .post('/environmentVariables:create')
      .send({ name, type: 'secret', value: 'initial-secret' });
    expect(created.status).toBe(200);
    expect(app.environment.getVariablesAndSecrets()[name]).toBe('initial-secret');
    expect(logs[0]).toMatchObject({
      targetCollection: 'environmentVariables',
      targetRecordUK: name,
      metadata: {
        request: { body: { name, type: 'secret' } },
        response: { body: { data: { name, type: 'secret' } } },
      },
    });
    expect(JSON.stringify(logs)).not.toContain('initial-secret');
    const updated = await app
      .agent()
      .post('/environmentVariables:update')
      .query({ filterByTk: name })
      .send({ value: 'replacement-secret' });
    expect(updated.status).toBe(200);
    expect(app.environment.getVariablesAndSecrets()[name]).toBe('replacement-secret');
    expect(logs[1].targetRecordUK).toBe(name);
    expect(logs[1].metadata.request.body).toEqual({});
    expect(logs[1].metadata.request.query).toEqual({ filterByTk: name });
    expect(JSON.stringify(logs)).not.toContain('replacement-secret');
  });

  it('handles a mixed batch of plain and secret values', async () => {
    const rows = [
      { name: 'AUDIT_PLAIN', type: 'default', value: 'batch-plain' },
      { name: 'AUDIT_BATCH_SECRET', type: 'secret', value: 'batch-secret' },
    ];
    const res = await app.agent().post('/environmentVariables:create').send(rows);
    expect(res.status).toBe(200);
    const expected = rows.map(({ name, type }) => ({ name, type }));
    expect(logs[0].metadata.request.body).toEqual(expected);
    expect(logs[0].metadata.response.body.data).toEqual(expected);
    expect(JSON.stringify(logs)).not.toMatch(/batch-plain|batch-secret/);
  });

  it.each(['firstOrCreate', 'updateOrCreate'])('sanitizes %s', async (action) => {
    const res = await app
      .agent()
      .post(`/environmentVariables:${action}?filterKeys[]=name`)
      .send({
        name: `AUDIT_${action}`,
        type: 'default',
        value: 'compound-value',
      });
    expect(res.status).toBe(200);
    expect(logs[0].action).toBe(action);
    expect(JSON.stringify(logs)).not.toContain('compound-value');
  });

  it('filters query parameters and error details on a failed write', async () => {
    const failed = await app
      .agent()
      .post('/environmentVariables:create')
      .query({ filter: JSON.stringify({ value: 'filter-value' }) })
      .send({ name: 'invalid-name', type: 'secret', value: 'failed-value' });
    expect(failed.status).toBeGreaterThanOrEqual(400);
    expect(logs[0].status).toBe(failed.status);
    expect(JSON.stringify(logs[0])).not.toMatch(/filter-value|failed-value/);
  });
});
