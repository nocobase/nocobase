import { mockDatabase } from './index';
import path from 'path';
import Database from '../database';

describe('database', () => {
  let db: Database;

  beforeEach(() => {
    db = mockDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  test('import', async () => {
    await db.import({
      directory: path.resolve(__dirname, './fixtures/c0'),
    });
    await db.import({
      directory: path.resolve(__dirname, './fixtures/c1'),
    });
    await db.import({
      directory: path.resolve(__dirname, './fixtures/c2'),
    });

    const test = db.getCollection('tests');

    expect(test.getField('n0')).toBeDefined();
    expect(test.getField('n1')).toBeDefined();
    expect(test.getField('n2')).toBeDefined();
  });
});
