class DAG {
  nodes: Set<string>;
  edges: Map<string, Set<string>>;

  constructor() {
    this.nodes = new Set();
    this.edges = new Map();
  }

  addNode(node: string): void {
    this.nodes.add(node);
  }

  removeNode(node: string): void {
    this.nodes.delete(node);
    this.edges.delete(node);
    this.edges.forEach((children) => children.delete(node));
  }

  addEdge(parent: string, child: string): void {
    if (!this.nodes.has(parent) || !this.nodes.has(child)) {
      throw new Error('Both parent and child nodes must be in the graph.');
    }

    const wouldCreateCycle = this.getAncestors(parent).has(child);

    if (wouldCreateCycle) {
      throw new Error('Adding this edge would create a cycle.');
    }

    const children = this.edges.get(parent);
    if (children) {
      children.add(child);
    } else {
      this.edges.set(parent, new Set([child]));
    }
  }

  removeEdge(parent: string, child: string): void {
    const children = this.edges.get(parent);
    if (children) {
      children.delete(child);
    }
  }

  getParents(node: string): Set<string> {
    const parents = new Set<string>();
    this.edges.forEach((children, parentNode) => {
      if (children.has(node)) {
        parents.add(parentNode);
      }
    });
    return parents;
  }

  getChildren(node: string): Set<string> {
    return this.edges.get(node) || new Set();
  }

  getAncestors(node: string): Set<string> {
    const ancestors = new Set<string>();
    const visit = (currentNode: string) => {
      const parents = this.getParents(currentNode);
      parents.forEach((parent) => {
        if (!ancestors.has(parent)) {
          ancestors.add(parent);
          visit(parent);
        }
      });
    };
    visit(node);
    return ancestors;
  }

  getDescendants(node: string): Set<string> {
    const descendants = new Set<string>();
    const visit = (currentNode: string) => {
      const children = this.getChildren(currentNode);
      children.forEach((child) => {
        if (!descendants.has(child)) {
          descendants.add(child);
          visit(child);
        }
      });
    };
    visit(node);
    return descendants;
  }

  getConnectedNodes(node: string): Set<string> {
    const visited = new Set<string>();
    const sortedNodes: string[] = [];

    const visit = (currentNode: string) => {
      if (!visited.has(currentNode)) {
        visited.add(currentNode);
        const children = this.edges.get(currentNode) || new Set();
        const parents = this.getParents(currentNode);

        for (const parent of parents) {
          visit(parent);
        }

        sortedNodes.push(currentNode);

        for (const child of children) {
          visit(child);
        }
      }
    };

    visit(node);

    return new Set(sortedNodes);
  }
}

export { DAG };
