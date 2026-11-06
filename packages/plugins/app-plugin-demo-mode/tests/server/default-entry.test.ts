import { authorizationToken } from '@nocobase/app-plugin-authorization';
import { createTestApp } from '@nocobase/app-testing/server';
import { expect, it } from 'vitest';

import { createStandaloneServer } from '../helpers/minimal-app.js';

it('enters an administrator with at most one read of each permission table', async () => {
  const app = await createTestApp({
    createServer: createStandaloneServer,
    config: { demoMode: { enabled: true } },
  });
  try {
    const tables = await Promise.all(
      [
        'authorizationPermissionSets',
        'authorizationPermissionSetAssignments',
      ].map(
        async (name) =>
          (await app.connection.collections.getPhysical(name)).tableName,
      ),
    );
    const client = await app.connection.client<{
      client: {
        on(event: 'query', listener: (query: { sql: string }) => void): void;
        off(event: 'query', listener: (query: { sql: string }) => void): void;
      };
    }>();
    const reads: string[] = [];
    const record = ({ sql }: { sql: string }) => {
      if (
        /^\s*select\b/iu.test(sql) &&
        tables.some((table) => sql.includes(table))
      )
        reads.push(sql);
    };
    client.client.on('query', record);
    let response: Response;
    try {
      response = await app.request('/demoMode/accounts/signInDefault', {
        method: 'POST',
        headers: { origin: 'http://localhost' },
      });
    } finally {
      client.client.off('query', record);
    }
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: { signedIn: true } });
    const cookie = response.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ');
    const session = await (
      await app.request('/auth/get-session', { headers: { cookie } })
    ).json();
    const authz = app.application.container.resolve(authorizationToken);
    expect(
      (await authz.permissionSets.listAssignments()).some(
        (assignment) =>
          assignment.subject.type === 'user' &&
          assignment.subject.id === session.user.id &&
          authz.permissionSets.protection(assignment.permissionSet)
            ?.unrestricted,
      ),
    ).toBe(true);
    // The query budget is the performance contract; session creation must still succeed.
    expect(reads.length).toBeLessThanOrEqual(2);
  } finally {
    await app.close();
  }
});
