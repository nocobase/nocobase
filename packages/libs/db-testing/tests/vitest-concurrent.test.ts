import { describe, expect } from 'vitest';
import { createDatabaseTest } from '../src/vitest.js';
import { migrations } from './fixtures/sources.js';

const test = createDatabaseTest({ migrations });

// Each test writes a row of its own and waits long enough for every sibling to have written theirs. On the
// file's shared databases the tests would reset and migrate the same database under one another and see each
// other's rows; a concurrent test therefore gets databases of its own.
describe.concurrent('createDatabaseTest with concurrent tests', () => {
  for (const id of ['first', 'second', 'third', 'fourth']) {
    test(`${id} sees only its own rows`, async ({ connection, task }) => {
      expect(task.concurrent).toBe(true);
      await connection
        .repository('libraryAuthors')
        .createOne({ values: { id, name: `Author ${id}` } });
      await new Promise((resolve) => setTimeout(resolve, 200));
      await expect(
        connection.query.selectFrom('libraryAuthors').select('id').execute(),
      ).resolves.toEqual([{ id }]);
    });
  }
});
