import lodash from 'lodash';

class TableNode {
  name: string;
  parents: Set<TableNode>;
  children: Set<TableNode>;
  constructor(name: string) {
    this.name = name;
    this.parents = new Set();
    this.children = new Set();
  }
}

export default class InheritanceMap {
  nodes: Map<string, TableNode> = new Map<string, TableNode>();

  getOrCreateNode(name: string) {
    if (!this.nodes.has(name)) {
      this.nodes.set(name, new TableNode(name));
    }
    return this.getNode(name);
  }

  getNode(name: string) {
    return this.nodes.get(name);
  }

  setInheritance(name: string, inherits: string | string[]) {
    const node = this.getOrCreateNode(name);
    const parents = lodash.castArray(inherits).map((name) => this.getOrCreateNode(name));

    node.parents = new Set(parents);

    for (const parent of parents) {
      parent.children.add(node);
    }
  }
}
