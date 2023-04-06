import lodash from 'lodash';
import { DAG, DAGNode } from './directed-graph';

export default class InheritanceMap {
  dag = new DAG();

  removeNode(name: string) {
    const node = this.getNode(name);
    if (!node) return;
    this.dag.removeNode(node);
  }

  getOrCreateNode(name: string) {
    if (!this.dag.nodes.has(name)) {
      this.dag.addNode(new DAGNode(name));
    }

    return this.getNode(name);
  }

  getNode(name: string) {
    return this.dag.nodes.get(name);
  }

  setInheritance(name: string, inherits: string | string[]) {
    const node = this.getOrCreateNode(name);
    for (const parent of lodash.castArray(inherits)) {
      const parentNode = this.getOrCreateNode(parent);
      this.dag.addEdge(parentNode, node);
    }
  }

  isParentNode(name: string) {
    const node = this.getNode(name);
    if (!node) return false;

    return this.dag.getChildren(node).length > 0;
  }

  getChildren(name: string, options: { deep: boolean } = { deep: true }): Set<string> {
    const node = this.getNode(name);
    if (!node) return new Set();

    return new Set((options.deep ? this.dag.getDescendants(node) : this.dag.getChildren(node)).map((n) => n.id));
  }

  getParents(name: string, options: { deep: boolean } = { deep: true }): Set<string> {
    const node = this.getNode(name);
    if (!node) return new Set();
    return new Set((options.deep ? this.dag.getAncestors(node) : this.dag.getParents(node)).map((n) => n.id));
  }
}
