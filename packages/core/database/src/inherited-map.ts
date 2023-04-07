import lodash from 'lodash';
import { DAG } from './directed-graph';

export default class InheritanceMap {
  dag = new DAG();

  removeNode(name: string) {
    const node = this.getNode(name);
    if (!node) return;
    this.dag.removeNode(node);
  }

  getOrCreateNode(name: string) {
    if (!this.dag.nodes.has(name)) {
      this.dag.addNode(name);
    }

    return this.getNode(name);
  }

  getNode(name: string) {
    if (!this.dag.nodes.has(name)) return null;
    return name;
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

    return this.dag.getChildren(node).size > 0;
  }

  getChildren(name: string, options: { deep: boolean } = { deep: true }): Set<string> {
    const node = this.getNode(name);
    if (!node) return new Set();

    return new Set(options.deep ? this.dag.getDescendants(node) : this.dag.getChildren(node));
  }

  getParents(name: string, options: { deep: boolean } = { deep: true }): Set<string> {
    const node = this.getNode(name);
    if (!node) return new Set();
    return new Set(options.deep ? this.dag.getAncestors(node) : this.dag.getParents(node));
  }

  getConnectedNodes(name: string): Set<string> {
    const node = this.getNode(name);
    if (!node) return new Set();

    return new Set([...this.dag.getConnectedNodes(node)]);
  }
}
