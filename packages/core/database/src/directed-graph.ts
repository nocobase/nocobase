class DAGNode {
  constructor(public id: string) {}
}

class DAG {
  nodes: Map<string, DAGNode>;
  edges: Map<string, DAGNode[]>;

  constructor() {
    this.nodes = new Map();
    this.edges = new Map();
  }

  addNode(node) {
    this.nodes.set(node.id, node);
    this.edges.set(node.id, []);
  }

  removeNode(node) {
    this.nodes.delete(node.id);
    this.edges.delete(node.id);
    for (const [_, children] of this.edges) {
      const index = children.indexOf(node);
      if (index !== -1) {
        children.splice(index, 1);
      }
    }
  }

  addEdge(fromNode, toNode) {
    if (this.isDescendant(toNode, fromNode)) {
      throw new Error('Adding this edge would create a cycle.');
    }
    this.edges.get(fromNode.id).push(toNode);
  }

  removeEdge(fromNode, toNode) {
    const children = this.edges.get(fromNode.id);
    const index = children.indexOf(toNode);
    if (index !== -1) {
      children.splice(index, 1);
    }
  }

  getParents(node) {
    const parents = [];
    for (const [parent, children] of this.edges) {
      if (children.includes(node)) {
        parents.push(this.nodes.get(parent));
      }
    }
    return parents;
  }

  getChildren(node) {
    return this.edges.get(node.id);
  }

  getAncestors(node) {
    const ancestors = [];
    const visit = (currentNode) => {
      const parents = this.getParents(currentNode);
      parents.forEach((parent) => {
        if (!ancestors.includes(parent)) {
          ancestors.push(parent);
          visit(parent);
        }
      });
    };
    visit(node);
    return ancestors;
  }

  getDescendants(node) {
    const descendants = [];
    const visit = (currentNode) => {
      const children = this.getChildren(currentNode);
      children.forEach((child) => {
        if (!descendants.includes(child)) {
          descendants.push(child);
          visit(child);
        }
      });
    };
    visit(node);
    return descendants;
  }

  isAncestor(node1, node2) {
    return this.getAncestors(node2).includes(node1);
  }

  isDescendant(node1, node2) {
    return this.getDescendants(node2).includes(node1);
  }

  topologicalSort() {
    const visited = new Set();
    const sorted = [];

    const visit = (node) => {
      if (!visited.has(node)) {
        visited.add(node);
        const children = this.getChildren(node);
        children.forEach(visit);
        sorted.unshift(node);
      }
    };

    for (const node of this.nodes.values()) {
      if (!visited.has(node)) {
        visit(node);
      }
    }

    return sorted;
  }
}

export { DAG, DAGNode };
