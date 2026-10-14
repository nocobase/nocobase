// db-test-portability: dialect-specific — verifies the MySQL driver's required READ COMMITTED isolation.
import { afterAll, beforeAll, expect, it } from 'vitest';
import {
  createTestDatabase,
  type TestDatabase,
} from '@nocobase/app-testing/server';
import { createAuthorization } from '../helpers/authorization-fixture.js';
import {
  permissionSetsPlugin,
  PermissionSetLastAssignmentError,
} from '@nocobase/authorization/permission-sets';
import { DatabasePermissionSetStore } from '../../server/stores/permission-sets.js';
import permissionSetMigration from '../../database/migrations/202608210001_create_permission_set_tables.js';
import { migrationContext } from '../helpers/database-fixture.js';

let fixture: TestDatabase;
beforeAll(async () => {
  fixture = await createTestDatabase();
  await permissionSetMigration.up(
    migrationContext(fixture.database.connection()),
  );
});
afterAll(async () => {
  await fixture.destroy();
});

it.runIf(process.env.NOCOBASE_TEST_DB_DIALECT === 'mysql')(
  'validates against current assignments after an earlier invitation-style read',
  async () => {
    const database = fixture.database;
    const key = 'snapshot-protection';
    const authorization = createAuthorization({
      plugins: [
        permissionSetsPlugin({
          store: new DatabasePermissionSetStore(() => database.connection()),
          rootSet: key,
        }),
      ],
    });
    await authorization.permissionSets.create({ key, grants: [] });
    for (const id of ['actor', 'target'])
      await authorization.permissionSets.assign({
        id: `${key}-${id}`,
        subject: { type: 'user', id },
        permissionSet: key,
      });
    await expect(
      database.transaction(async (connection) => {
        const sets = authorization.permissionSets.withTransaction(connection);
        // Like create/invitation orchestration, this read precedes scope.replace.
        // NocoBase's MySQL driver sets READ COMMITTED before handing out connections.
        await sets.get(key);
        await authorization.permissionSets.revoke(`${key}-actor`);
        await sets.replaceSubjectAssignments({
          subject: { type: 'user', id: 'target' },
          managedPermissionSets: [key],
          permissionSets: [],
          async beforeReplace() {
            expect(
              (await sets.listAssignments(key)).map((item) => item.subject.id),
            ).toEqual(['target']);
          },
        });
      }),
    ).rejects.toBeInstanceOf(PermissionSetLastAssignmentError);
    expect(
      await authorization.permissionSets.listAssignments(key),
    ).toHaveLength(1);
  },
);
