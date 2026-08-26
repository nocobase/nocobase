/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';

// Regression coverage for the `ws:message:auth:token` handler in
// plugin-auth's server entry. The handler is registered with `app.on`, which
// is Node's sync EventEmitter — any rejection thrown inside the async
// listener becomes an unhandled promise rejection and (under Node's default
// policy) crashes the process. These cases exercise the failure paths that
// were known to crash before the handler grew defensive try/catch coverage.

type RemoveTagPayload = { clientId: string; tagKey: string };

function nextRemoveTag(app: MockServer): Promise<RemoveTagPayload> {
  return new Promise((resolve) => {
    app.once('ws:removeTag', resolve);
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);
}

describe('ws:message:auth:token handler', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['field-sort', 'users', 'auth'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('removes the userId tag when the payload has no token', async () => {
    const removeTag = nextRemoveTag(app);
    app.emit('ws:message:auth:token', {
      clientId: 'client-no-token',
      payload: { token: '' },
    });
    const result = await withTimeout(removeTag, 2000, 'ws:removeTag for empty token');
    expect(result.clientId).toBe('client-no-token');
    expect(result.tagKey).toBe('userId');
  });

  it('removes the userId tag when the authenticator name is not registered in the DB', async () => {
    // No authenticator row was seeded with this name, so `authManager.get`
    // throws `Authenticator [no-such-authenticator] is not found.`. Before
    // the fix this rejection escaped the async listener and crashed Node.
    const removeTag = nextRemoveTag(app);
    app.emit('ws:message:auth:token', {
      clientId: 'client-bad-authenticator',
      payload: { token: 'irrelevant', authenticator: 'no-such-authenticator' },
    });
    const result = await withTimeout(removeTag, 2000, 'ws:removeTag for missing authenticator');
    expect(result.clientId).toBe('client-bad-authenticator');
    expect(result.tagKey).toBe('userId');
  });

  it('removes the userId tag when the authenticator references an unregistered authType', async () => {
    // Seed an authenticator whose `authType` (`CAS`) no plugin in this app
    // has registered — this is the production-observed shape: a DB row left
    // over from when an auth plugin was previously enabled. Resolving it
    // throws `AuthType [CAS] is not found.` from AuthManager.
    await app.db.getRepository('authenticators').create({
      values: {
        name: 'stranded-cas',
        authType: 'CAS',
        enabled: true,
        options: {},
      },
    });

    const removeTag = nextRemoveTag(app);
    app.emit('ws:message:auth:token', {
      clientId: 'client-unregistered-authtype',
      payload: { token: 'irrelevant', authenticator: 'stranded-cas' },
    });
    const result = await withTimeout(removeTag, 2000, 'ws:removeTag for unregistered authType');
    expect(result.clientId).toBe('client-unregistered-authtype');
    expect(result.tagKey).toBe('userId');
  });
});
