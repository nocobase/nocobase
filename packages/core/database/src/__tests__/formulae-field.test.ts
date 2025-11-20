import Database from '../database';
import { FormulaField } from '../fields/formula-field';

describe('FormulaField auto-update', () => {
  let db: Database;

  beforeAll(async () => {
    db = new Database({
      dialect: 'sqlite', // or 'postgres' depending on CI setup
      storage: ':memory:',
    });

    // Define a test collection with dependent fields
    db.collection({
      name: 'records',
      fields: [
        { type: 'number', name: 'x' },
        { type: 'number', name: 'y' },
        { type: 'number', name: 'z' },
        { type: 'number', name: 'r' },
        { type: 'formula', name: 'formula', formula: '(x + y) - (z + r)' },
      ],
    });

    await db.sync();
  });

  afterAll(async () => {
    await db.close();
  });

  it('should recompute when dependent fields change', async () => {
    const Records = db.getCollection('records');

    // Create a record
    const record = await Records.repository.create({
      values: { x: 2, y: 3, z: 1, r: 1 },
    });

    // Initial check
    expect(record.get('formula')).toBe(3); // (2 + 3) - (1 + 1)

    // Update one dependency
    await Records.repository.update({
      filter: { id: record.get('id') },
      values: { x: 4 },
    });

    const updated = await Records.repository.findOne({
      filter: { id: record.get('id') },
    });

    expect(updated.get('formula')).toBe((4 + 3) - (1 + 1));
  });
});
