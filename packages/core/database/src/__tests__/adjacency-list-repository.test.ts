import { mockDatabase } from './';
import Database from '../database';

describe('adjacency list repository', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase({
      tablePrefix: '',
    });
    await db.clean({ drop: true });
  });

  afterEach(async () => {
    await db.close();
  });

  it('should append parent recursively', async () => {
    const Tree = db.collection({
      name: 'categories',
      tree: 'adjacency-list',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'belongsTo',
          name: 'parent',
          treeParent: true,
        },
        {
          type: 'hasMany',
          name: 'children',
          treeChildren: true,
        },
      ],
    });

    await db.sync();

    await Tree.repository.create({
      values: [
        {
          name: 'c1',
          children: [
            {
              name: 'c1-1',
              children: [
                {
                  name: 'c1-1-1',
                },
              ],
            },
            {
              name: 'c12',
            },
          ],
        },
      ],
    });

    const c111 = await Tree.repository.findOne({ where: { name: 'c1-1-1' }, appends: ['parent(recursively=true)'] });
    expect(c111.parent.name).toBe('c1-1');
    expect(c111.parent.parent.name).toBe('c1');
  });
});
