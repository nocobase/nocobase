import { CollectionGraph } from '../collections-graph';

describe('collection graph', () => {
  it('should build collection graph', async () => {
    const collections = [
      {
        name: 'a',
        fields: [],
      },
      {
        name: 'b',
        inherits: ['a'],
        fields: [
          {
            name: 'bField',
            type: 'hasMany',
            target: 'c',
          },
        ],
      },
      {
        name: 'c',
      },
    ];

    const preOrder = CollectionGraph.preOrder({
      collections,
      node: 'b',
    });

    expect(preOrder).toEqual(['b', 'a', 'c']);

    const preOrderReverse = CollectionGraph.preOrder({
      collections,
      node: 'a',
      direction: 'reverse',
    });

    expect(preOrderReverse).toEqual(['a', 'b']);
  });
});
