import path from 'node:path';
import { createTestDatabase } from '@nocobase/app-testing/server';
import { expect, it, onTestFinished } from 'vitest';

it('seeds six articles once and preserves user edits', async () => {
  const fixture = await createTestDatabase({
    migrations: [
      {
        packageName: 'articles',
        directory: path.resolve(
          import.meta.dirname,
          '../../database/main/migrations',
        ),
      },
    ],
  });
  onTestFinished(() => fixture.destroy());
  const db = fixture.database;
  const seeder = db.createSeeder({
    directory: path.resolve(import.meta.dirname, '../../database/main/seeds'),
    packageName: 'articles',
  });
  await seeder.run();
  await db
    .query()
    .updateTable('articles')
    .set({ content: 'User edit' })
    .where('title', '=', '欢迎来到文章中心')
    .execute();
  expect(await seeder.run()).toMatchObject({ executed: [] });
  const rows = await db.query().selectFrom('articles').selectAll().execute();
  expect(rows).toHaveLength(6);
  expect(rows.filter((row) => row.status === 'draft')).toHaveLength(2);
  expect(rows.find((row) => row.title === '欢迎来到文章中心')?.content).toBe(
    'User edit',
  );
});
