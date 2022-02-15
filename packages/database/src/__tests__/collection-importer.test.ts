import { ImporterReader } from '../collection-importer';
import * as path from 'path';
import { extend } from '../database';

describe('collection importer', () => {
  test('import reader', async () => {
    const reader = new ImporterReader(path.resolve(__dirname, './fixtures/collections'));

    const modules = await reader.read();
    expect(modules).toBeDefined();
  });

  test('extend', async () => {
    const extendObject = extend({
      name: 'tags',
      fields: [{ type: 'string', name: 'title' }],
    });

    expect(extendObject).toHaveProperty('extend');
  });
});
