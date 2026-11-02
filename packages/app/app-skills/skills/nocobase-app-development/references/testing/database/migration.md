# Database example: apply, roll back and reapply a migration

Use `describeMigration()` to verify the schema a migration produces and what its rollback leaves behind. It executes the migration through the migrator on a real test database, including metadata checks, instead of calling `up()` with a mocked builder.

## Prerequisites

Create `vitest.database.config.ts`, the fixture migration and `tests/helpers/testing-notes.ts` from [the repository example](repository.md). This example targets that exact migration name. For application work, use the actual migration name and sources, including any earlier migrations it depends on. Do not modify a migration already merged into the target branch; write and test a new correction migration.

## Test the schema

Create `tests/database/notes-migration.test.ts`:

```ts
import { describeMigration } from '@nocobase/app-testing/server';
import { noteMigrations } from '../helpers/testing-notes.js';

describeMigration('202610180001_testing_create_notes', {
  sources: noteMigrations,
  up: async ({ expectCollection }) => {
    await expectCollection('testingNotes').toHaveField('id', {
      type: 'string',
      nullable: false,
    });
    await expectCollection('testingNotes').toHaveField('title', {
      type: 'string',
      nullable: false,
    });
    await expectCollection('testingNotes').toHaveIndex(['title'], {
      unique: true,
    });
  },
  down: async ({ expectCollection }) => {
    await expectCollection('testingNotes').not.toExist();
  },
});
```

The helper owns and destroys its database, including when a callback fails. It applies earlier migrations, applies this migration and calls `up`, rolls it back and calls `down`, then reapplies it and calls `up` again. It also checks agreement between collection metadata and physical tables and that rollback restores the previous schema. Keep `up` assertions valid on both passes.

`expectCollection()` uses logical collection and field names, so the checks do not depend on a database's generated index names, case folding or schema-inspection SQL. For a data migration, use the helper's `before` callback to insert pre-migration records and assert the transformed values in `up`. A table alteration should leave its original table intact after `down`, so assert the removed field or index rather than copying the table-removal assertion above.

## Run and check

```bash
pnpm exec vitest run --config vitest.database.config.ts tests/database/notes-migration.test.ts
```

Expect one passing test; within that test the helper applies the migration, rolls it back and applies it again, with the assertions at each stage. A no-op `down` would leave the collection behind and fail. For a deliberately irreversible migration, `reversible: false` verifies application only; it is not a way to bypass a broken rollback.

Return to [testing and verification](../../testing.md).
