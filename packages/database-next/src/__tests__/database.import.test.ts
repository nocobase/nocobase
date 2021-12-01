import { mockDatabase } from './index';
import path from 'path';

describe('database', () => {
  test('import', async () => {
    const db = mockDatabase();
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

    console.log(test.options.fields);
  });
});
