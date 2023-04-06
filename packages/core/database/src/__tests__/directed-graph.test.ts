import { DAGNode, DAG } from '../directed-graph'; // 如果类在单独的文件中，请确保使用正确的导入路径

describe('DAGNode', () => {
  it('should create a DAGNode with the given id', () => {
    const node = new DAGNode('A');
    expect(node.id).toBe('A');
  });
});

describe('DAG', () => {
  let dag: DAG;
  let nodeA: DAGNode;
  let nodeB: DAGNode;
  let nodeC: DAGNode;

  beforeEach(() => {
    dag = new DAG();
    nodeA = new DAGNode('A');
    nodeB = new DAGNode('B');
    nodeC = new DAGNode('C');
  });

  it('should add nodes to the DAG', () => {
    dag.addNode(nodeA);
    expect(dag.nodes.size).toBe(1);
  });

  it('should remove nodes from the DAG', () => {
    dag.addNode(nodeA);
    dag.removeNode(nodeA);
    expect(dag.nodes.size).toBe(0);
  });

  it('should add edges between nodes', () => {
    dag.addNode(nodeA);
    dag.addNode(nodeB);
    dag.addEdge(nodeA, nodeB);
    expect(dag.getChildren(nodeA)).toContain(nodeB);
  });

  it('should remove edges between nodes', () => {
    dag.addNode(nodeA);
    dag.addNode(nodeB);
    dag.addEdge(nodeA, nodeB);
    dag.removeEdge(nodeA, nodeB);
    expect(dag.getChildren(nodeA)).not.toContain(nodeB);
  });

  it('should return the parents of a node', () => {
    dag.addNode(nodeA);
    dag.addNode(nodeB);
    dag.addEdge(nodeA, nodeB);
    expect(dag.getParents(nodeB)).toContain(nodeA);
  });

  it('should return the children of a node', () => {
    dag.addNode(nodeA);
    dag.addNode(nodeB);
    dag.addEdge(nodeA, nodeB);
    expect(dag.getChildren(nodeA)).toContain(nodeB);
  });

  it('should return the ancestors of a node', () => {
    dag.addNode(nodeA);
    dag.addNode(nodeB);
    dag.addNode(nodeC);
    dag.addEdge(nodeA, nodeB);
    dag.addEdge(nodeB, nodeC);
    expect(dag.getAncestors(nodeC)).toEqual([nodeB, nodeA]);
  });

  it('should return the descendants of a node', () => {
    dag.addNode(nodeA);
    dag.addNode(nodeB);
    dag.addNode(nodeC);
    dag.addEdge(nodeA, nodeB);
    dag.addEdge(nodeB, nodeC);
    expect(dag.getDescendants(nodeA)).toEqual([nodeB, nodeC]);
  });

  it('should detect ancestor relationships', () => {
    dag.addNode(nodeA);
    dag.addNode(nodeB);
    dag.addEdge(nodeA, nodeB);
    expect(dag.isAncestor(nodeA, nodeB)).toBe(true);
    expect(dag.isAncestor(nodeB, nodeA)).toBe(false);
  });

  it('should detect descendant relationships', () => {
    dag.addNode(nodeA);
    dag.addNode(nodeB);
    dag.addEdge(nodeA, nodeB);
    expect(dag.isDescendant(nodeB, nodeA)).toBe(true);
    expect(dag.isDescendant(nodeA, nodeB)).toBe(false);
  });

  it('should return a topological sort of the nodes', () => {
    dag.addNode(nodeA);
    dag.addNode(nodeB);
    dag.addNode(nodeC);
    dag.addEdge(nodeA, nodeB);
    dag.addEdge(nodeB, nodeC);

    const sorted = dag.topologicalSort();
    const nodeIndices = new Map(sorted.map((node, index) => [node.id, index]));

    expect(sorted.length).toBe(3);
    expect(nodeIndices.get('A')).toBeLessThan(nodeIndices.get('B'));
    expect(nodeIndices.get('B')).toBeLessThan(nodeIndices.get('C'));
  });

  it('should throw an error when adding an edge that creates a cycle', () => {
    dag.addNode(nodeA);
    dag.addNode(nodeB);
    dag.addNode(nodeC);
    dag.addEdge(nodeA, nodeB);
    dag.addEdge(nodeB, nodeC);

    expect(() => dag.addEdge(nodeC, nodeA)).toThrowError('Adding this edge would create a cycle.');
  });

  it('should return all connected nodes of a given node', () => {
    const nodeD = new DAGNode('D');
    dag.addNode(nodeA);
    dag.addNode(nodeB);
    dag.addNode(nodeC);
    dag.addNode(nodeD);
    dag.addEdge(nodeA, nodeC);
    dag.addEdge(nodeB, nodeC);
    dag.addEdge(nodeB, nodeD);

    const connectedNodes = dag.getConnectedNodes(nodeC);
    expect(connectedNodes.size).toBe(4);
    expect(connectedNodes.has(nodeA)).toBe(true);
    expect(connectedNodes.has(nodeB)).toBe(true);
    expect(connectedNodes.has(nodeC)).toBe(true);
    expect(connectedNodes.has(nodeD)).toBe(true);
  });
});
