import { DAG } from '../directed-graph';

describe('DAG', () => {
  let dag: DAG;

  beforeEach(() => {
    dag = new DAG();
  });

  it('should add nodes', () => {
    dag.addNode('A');
    dag.addNode('B');
    expect(dag.nodes.size).toBe(2);
  });

  it('should remove nodes', () => {
    dag.addNode('A');
    dag.addNode('B');
    dag.removeNode('A');
    expect(dag.nodes.size).toBe(1);
    expect(dag.nodes.has('B')).toBe(true);
  });

  it('should add edges', () => {
    dag.addNode('A');
    dag.addNode('B');
    dag.addEdge('A', 'B');
    expect(dag.edges.get('A')).toEqual(new Set(['B']));
  });

  it('should remove edges', () => {
    dag.addNode('A');
    dag.addNode('B');
    dag.addEdge('A', 'B');
    dag.removeEdge('A', 'B');
    expect(dag.edges.get('A')).toEqual(new Set());
  });

  it('should get parents of a node', () => {
    dag.addNode('A');
    dag.addNode('B');
    dag.addNode('C');
    dag.addEdge('A', 'C');
    dag.addEdge('B', 'C');
    const parents = dag.getParents('C');
    expect(parents.size).toBe(2);
    expect(parents).toEqual(new Set(['A', 'B']));
  });

  it('should get children of a node', () => {
    dag.addNode('A');
    dag.addNode('B');
    dag.addNode('C');
    dag.addEdge('A', 'C');
    dag.addEdge('B', 'C');
    const children = dag.getChildren('A');
    expect(children.size).toBe(1);
    expect(children).toEqual(new Set(['C']));
  });

  it('should get ancestors of a node', () => {
    dag.addNode('A');
    dag.addNode('B');
    dag.addNode('C');
    dag.addEdge('A', 'B');
    dag.addEdge('B', 'C');
    const ancestors = dag.getAncestors('C');
    expect(ancestors.size).toBe(2);
    expect(ancestors).toEqual(new Set(['A', 'B']));
  });

  it('should get descendants of a node', () => {
    dag.addNode('A');
    dag.addNode('B');
    dag.addNode('C');
    dag.addEdge('A', 'B');
    dag.addEdge('B', 'C');
    const descendants = dag.getDescendants('A');
    expect(descendants.size).toBe(2);
    expect(descendants).toEqual(new Set(['B', 'C']));
  });

  it('should throw an error when adding an edge that creates a cycle', () => {
    dag.addNode('A');
    dag.addNode('B');
    dag.addNode('C');
    dag.addEdge('A', 'B');
    dag.addEdge('B', 'C');

    expect(() => dag.addEdge('C', 'A')).toThrowError('Adding this edge would create a cycle.');
  });

  it('should return all connected nodes of a given node', () => {
    dag.addNode('A');
    dag.addNode('B');
    dag.addNode('C');
    dag.addNode('D');
    dag.addEdge('A', 'C');
    dag.addEdge('B', 'C');
    dag.addEdge('B', 'D');

    const connectedNodes = dag.getConnectedNodes('C');
    expect(connectedNodes.size).toBe(4);
    expect(connectedNodes).toEqual(new Set(['A', 'B', 'C', 'D']));
  });
});
