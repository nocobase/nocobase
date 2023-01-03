import lodash from 'lodash';
import Database from './database';

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

  removeNode(name: string) {
    const node = this.nodes.get(name);
    if (!node) return;

    for (const parent of node.parents) {
      parent.children.delete(node);
    }

    for (const child of node.children) {
      child.parents.delete(node);
    }

    this.nodes.delete(name);
  }

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

  isParentNode(name: string) {
    const node = this.getNode(name);
    return node && node.children.size > 0;
  }

  getChildren(name: string, options: { deep: boolean } = { deep: true }): Set<string> {
    const results = new Set<string>();
    const node = this.getNode(name);
    if (!node) return results;

    for (const child of node.children) {
      results.add(child.name);
      if (!options.deep) {
        continue;
      }

      for (const grandchild of this.getChildren(child.name)) {
        results.add(grandchild);
      }
    }

    return results;
  }

  getParents(name: string, options: { deep: boolean } = { deep: true }): Set<string> {
    const results = new Set<string>();
    const node = this.getNode(name);
    if (!node) return results;

    for (const parent of node.parents) {
      results.add(parent.name);
      if (!options.deep) {
        continue;
      }

      for (const grandparent of this.getParents(parent.name)) {
        results.add(grandparent);
      }
    }

    return results;
  }
}
