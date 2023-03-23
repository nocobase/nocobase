import { CollectionsGraph } from '../collections-graph';

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

      {
        name: 'a1',
        fields: [
          {
            name: 'a1Field',
            type: 'hasMany',
            target: 'b1',
          },
        ],
      },
      {
        name: 'b1',
      },
    ];

    const connectedNodes = CollectionsGraph.connectedNodes({
      collections,
      nodes: ['b', 'a1'],
    });

    expect(connectedNodes).toEqual(['b', 'a', 'c', 'a1', 'b1']);

    const preOrderReverse = CollectionsGraph.preOrder({
      collections,
      node: 'a',
      direction: 'reverse',
    });

    expect(preOrderReverse).toEqual(['a', 'b']);
  });
});
