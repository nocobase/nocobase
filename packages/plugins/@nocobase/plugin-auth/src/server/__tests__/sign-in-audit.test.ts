/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';

describe('sign-in audit metadata', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({ plugins: ['field-sort', 'auth', 'users', 'acl', 'data-source-manager'] });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should omit only the token from the audited response', async () => {
    const log = vi.fn();
    app.auditManager.setLogger({ log });
    const account = 'audit@example.com';
    const password = 'test-password';
    await app.db.getRepository('users').create({ values: { email: account, password } });
    const res = await app.agent().post('/auth:signIn').set({ 'X-Authenticator': 'basic' }).send({ account, password });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    await vi.waitFor(() => expect(log).toHaveBeenCalled());
    const metadata = JSON.parse(JSON.stringify(log.mock.calls[0][0].metadata));
    const expectedBody = { ...res.body, data: { ...res.body.data } };
    delete expectedBody.data.token;
    expect(metadata.response.body).toEqual(expectedBody);
    expect(metadata.request.body).toEqual({ account });
  });
});
