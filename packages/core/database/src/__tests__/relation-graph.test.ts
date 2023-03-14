import { Database } from '../database';
import RelationGraph from '../relation-graph';
import { mockDatabase } from './';

describe('relation graph', () => {
  let db: Database;

  beforeEach(async () => {
    db = mockDatabase();
  });

  afterEach(async () => {
    await db.close();
  });

  it('should build graph', () => {
    db.collection({
      name: 'posts_tags',
    });

    db.collection({
      name: 'users',
      fields: [
        { name: 'name', type: 'string' },
        { name: 'posts', type: 'hasMany' },
      ],
    });

    db.collection({
      name: 'posts',
      fields: [
        {
          name: 'title',
          type: 'string',
        },
        {
          name: 'tags',
          type: 'belongsToMany',
          through: 'posts_tags',
        },
      ],
    });

    db.collection({
      name: 'tags',
      fields: [
        {
          name: 'name',
          type: 'string',
        },
      ],
    });

    const graph = RelationGraph.build(db);
    expect(RelationGraph.preOrder(graph, 'users')).toEqual(['users', 'posts', 'posts_tags', 'tags']);
    expect(RelationGraph.preOrder(graph, 'tags')).toEqual(['tags']);

    // reverse order
    const reverseGraph = RelationGraph.build(db, { direction: 'reverse' });
    expect(RelationGraph.preOrder(reverseGraph, 'posts')).toEqual(['posts', 'users']);
  });
});
