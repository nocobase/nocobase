import { expect, it } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { createStandaloneServer } from '../../server/standalone.js';

type Assignment = {
  subjectType: unknown;
  subjectId: unknown;
  permissionSetKey: unknown;
};

function unexpectedGlobalAssignments(
  assignments: readonly Assignment[],
): Assignment[] {
  return assignments.filter((assignment) => assignment.subjectId === '*');
}

const test = createAppTest({
  createServer: createStandaloneServer,
  connections: ['main'],
  config: {
    app: { publicOrigin: 'http://localhost' },
    auth: { secret: 'test-auth-secret-at-least-32-characters' },
  },
});

test('initialization does not silently grant business roles to every signed-in user', async ({
  connection,
}) => {
  const assignments = await connection.query
    .selectFrom('authorizationPermissionSetAssignments')
    .select(['subjectType', 'subjectId', 'permissionSetKey'])
    .execute();
  expect(
    unexpectedGlobalAssignments(assignments),
    'Global role assignments must be explicitly requested and editable in administration. Use per-user role assignments by default; do not remove this guard to make a feature accessible.',
  ).toEqual([]);
  const member = await connection.query
    .selectFrom('authorizationPermissionSets')
    .select(['grants'])
    .where('key', '=', 'member')
    .executeTakeFirstOrThrow();
  let grants: unknown = member.grants;
  // Database JSON codecs may preserve the serialized seed value as a string.
  while (typeof grants === 'string') grants = JSON.parse(grants) as unknown;
  expect(
    grants,
    'The inherited platform member role must not conceal application business grants. Assign a separate business role to explicit users.',
  ).toEqual([]);
});

it('detects wildcard recipients regardless of the role name, while preserving explicit user assignments', () => {
  const global = {
    subjectType: 'authenticated',
    subjectId: '*',
    permissionSetKey: 'task-member',
  };
  expect(
    unexpectedGlobalAssignments([
      {
        subjectType: 'authenticated',
        subjectId: '*',
        permissionSetKey: 'member',
      },
      {
        subjectType: 'user',
        subjectId: 'user-1',
        permissionSetKey: 'task-member',
      },
      global,
      { ...global, subjectType: 'everyone' },
    ]),
  ).toEqual([
    {
      subjectType: 'authenticated',
      subjectId: '*',
      permissionSetKey: 'member',
    },
    global,
    { ...global, subjectType: 'everyone' },
  ]);
});
