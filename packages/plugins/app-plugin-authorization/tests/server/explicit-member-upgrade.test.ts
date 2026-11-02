import { createAppAuthorization } from '../../server/authorization.js';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { createTestDatabase } from '@nocobase/app-testing/server';
import {
  createMigrator,
  createSeeder,
  type SeedContext,
  type DatabaseConnection,
} from '@nocobase/db';
import { ServiceContainer } from '@nocobase/service-provider';
import memberSeed from '../../database/seeds/202608250002_authorization_create_member_set.js';
import upgrade from '../../database/seeds/202611010001_authorization_explicit_member_assignments.js';

it('preserves legacy grants and users atomically, and never restores later removals', async () => {
  const fixture = await createTestDatabase();
  const { database } = fixture;
  const source = (plugin: string, kind: string) => ({
    packageName: `@nocobase/${plugin}`,
    directory: fileURLToPath(
      new URL(`../../../${plugin}/database/${kind}`, import.meta.url),
    ),
  });
  const context = (connection: DatabaseConnection): SeedContext => ({
    connection,
    query: connection.query,
    repository: connection.repository.bind(connection),
    container: new ServiceContainer(),
    config: { get: () => undefined },
  });
  try {
    await createMigrator({
      database,
      sources: [
        source('app-plugin-authentication', 'migrations'),
        source('app-plugin-authorization', 'migrations'),
      ],
    }).latest();
    const connection = database.connection();
    const now = new Date();
    for (const [id, kind, disabledAt] of [
      ['ordinary', 'person', null],
      ['disabled', 'person', now],
      ['service', 'service', null],
    ] as const) {
      await connection.query
        .insertInto('user')
        .values({
          id,
          kind,
          name: id,
          email: `${id}@example.test`,
          emailVerified: true,
          disabledAt,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
    }
    await memberSeed.run(context(connection));
    const grants = JSON.stringify([
      { resource: { type: 'custom', id: '*' }, actions: [{ action: 'read' }] },
    ]);
    await connection.query
      .updateTable('authorizationPermissionSets')
      .set({ grants })
      .where('key', '=', 'member')
      .execute();
    await connection.query
      .insertInto('authorizationPermissionSetAssignments')
      .values({
        id: 'existing-other',
        subjectType: 'user',
        subjectId: 'ordinary',
        permissionSetKey: 'other',
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    const authorization = createAppAuthorization({ connection });
    await authorization.permissionSets.create({
      key: 'other',
      grants: [
        {
          resource: { type: 'other-business', id: '*' },
          actions: [{ action: 'read' }],
        },
      ],
    });
    await authorization.permissionSets.assign({
      subject: { type: 'user', id: 'disabled' },
      permissionSet: 'member',
    });
    const effective = async () =>
      (
        await authorization.permissionSets.getEffective({
          principal: { type: 'user', id: 'ordinary' },
          subjects: [{ type: 'authenticated', id: '*' }],
        })
      )
        .map(({ key, grants }) => ({ key, grants }))
        .sort((a, b) => a.key.localeCompare(b.key));
    const beforeEffective = await effective();
    const assignments = () =>
      connection.query
        .selectFrom('authorizationPermissionSetAssignments')
        .selectAll()
        .orderBy('id')
        .execute();
    const before = await assignments();
    await expect(
      database.transaction(async (transaction) => {
        await upgrade.run(context(transaction));
        throw new Error('Interrupted before commit');
      }),
    ).rejects.toThrow('Interrupted before commit');
    expect(await assignments()).toEqual(before);
    // Interrupt after backfill but before deleting the old audience assignment.
    await expect(
      database.transaction(async (transaction) => {
        const base = context(transaction);
        await upgrade.run({
          ...base,
          query: new Proxy(base.query, {
            get(target, property) {
              if (property === 'deleteFrom')
                return () => {
                  throw new Error('Interrupted before audience removal');
                };
              const value = Reflect.get(target, property);
              return typeof value === 'function' ? value.bind(target) : value;
            },
          }),
        });
      }),
    ).rejects.toThrow('Interrupted before audience removal');
    expect(await assignments()).toEqual(before);
    const seeder = createSeeder({
      database,
      sources: [source('app-plugin-authorization', 'seeds')],
    });
    await seeder.run();
    const after = await assignments();
    expect(await effective()).toEqual(beforeEffective);
    expect(
      after
        .filter((row) => row.permissionSetKey === 'member')
        .map((row) => row.subjectId)
        .sort(),
    ).toEqual(['disabled', 'ordinary', 'service']);
    expect(after.some((row) => row.id === 'existing-other')).toBe(true);
    const member = await connection.query
      .selectFrom('authorizationPermissionSets')
      .select('grants')
      .where('key', '=', 'member')
      .executeTakeFirstOrThrow();
    expect(member.grants).toEqual(grants);
    await connection.query
      .deleteFrom('authorizationPermissionSetAssignments')
      .where('id', '=', 'user:ordinary:member')
      .execute();
    await seeder.run();
    await database.transaction((transaction) =>
      upgrade.run(context(transaction)),
    );
    expect(
      (await assignments()).some((row) => row.id === 'user:ordinary:member'),
    ).toBe(false);
  } finally {
    await fixture.destroy();
  }
});
