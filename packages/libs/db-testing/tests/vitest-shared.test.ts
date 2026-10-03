import { describe, expect } from 'vitest';
import { createDatabaseTest } from '../src/vitest.js';
import { migrations } from './fixtures/sources.js';

const test = createDatabaseTest({ migrations, isolation: 'none' });

describe('createDatabaseTest without isolation', () => {
  test('writes a row', async ({ connection }) => {
    await connection.repository('libraryAuthors').createOne({
      values: { id: 'author-3', name: 'Barbara' },
    });
  });

  test('sees the row the previous test wrote', async ({ connection }) => {
    await expect(
      connection.repository('libraryAuthors').findOne({
        filter: { id: 'author-3' },
      }),
    ).resolves.toMatchObject({ name: 'Barbara' });
  });
});
