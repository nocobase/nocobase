import { defineSeed, type SeedDefinition } from '@nocobase/db';

/** Run with old application writers stopped; the seed and its ledger commit together. */
const seed: SeedDefinition = defineSeed({
  name: '202611010001_authorization_explicit_member_assignments',
  transaction: true,
  async run({ query }) {
    const legacy = await query
      .selectFrom('authorizationPermissionSetAssignments')
      .select('id')
      .where('subjectType', '=', 'authenticated')
      .where('subjectId', '=', '*')
      .where('permissionSetKey', '=', 'member')
      .executeTakeFirst();
    // This guard also respects removals when the conversion is invoked directly again.
    if (!legacy) return;
    let after = '';
    while (true) {
      const users = await query
        .selectFrom('user')
        .select('id')
        .where('deletedAt', 'is', null)
        .where('id', '>', after)
        .orderBy('id')
        .limit(200)
        .execute();
      if (!users.length) break;
      const ids = users.map((user) => String(user.id));
      const existing = await query
        .selectFrom('authorizationPermissionSetAssignments')
        .select('subjectId')
        .where('subjectType', '=', 'user')
        .where('permissionSetKey', '=', 'member')
        .where('subjectId', 'in', ids)
        .execute();
      const assigned = new Set(existing.map((row) => String(row.subjectId)));
      const now = new Date();
      const missing = ids
        .filter((id) => !assigned.has(id))
        .map((id) => ({
          id: `user:${id}:member`,
          subjectType: 'user',
          subjectId: id,
          permissionSetKey: 'member',
          createdAt: now,
          updatedAt: now,
        }));
      if (missing.length)
        await query
          .insertInto('authorizationPermissionSetAssignments')
          .values(missing)
          .execute();
      after = ids.at(-1)!;
    }
    await query
      .deleteFrom('authorizationPermissionSetAssignments')
      .where('id', '=', legacy.id)
      .execute();
  },
});

export default seed;
