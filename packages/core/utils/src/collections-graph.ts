import * as graphlib from 'graphlib';
import { castArray } from 'lodash';

type BuildGraphOptions = {
  direction?: 'forward' | 'reverse';
  collections: any[];
};

export class CollectionsGraph {
  static graphlib() {
    return graphlib;
  }

  static connectedNodes(options: BuildGraphOptions & { nodes: Array<string>; excludes?: Array<string> }) {
    const nodes = castArray(options.nodes);
    const excludes = castArray(options.excludes || []);

    const graph = CollectionsGraph.build(options);
    const connectedNodes = new Set();
    for (const node of nodes) {
      const connected = graphlib.alg.preorder(graph, node);
      for (const connectedNode of connected) {
        if (excludes.includes(connectedNode)) continue;
        connectedNodes.add(connectedNode);
      }
    }

    return Array.from(connectedNodes);
  }

  static preOrder(options: BuildGraphOptions & { node: string }) {
    return CollectionsGraph.graphlib().alg.preorder(CollectionsGraph.build(options), options.node);
  }

  static build(options: BuildGraphOptions) {
    const collections = options.collections;
    const direction = options?.direction || 'forward';
    const isForward = direction === 'forward';

    const graph = new graphlib.Graph();

    for (const collection of collections) {
      graph.setNode(collection.name);
    }

    for (const collection of collections) {
      const parents = collection.inherits || [];
      for (const parent of parents) {
        if (isForward) {
          graph.setEdge(collection.name, parent);
        } else {
          graph.setEdge(parent, collection.name);
        }
      }

      for (const field of collection.fields || []) {
        if (field.type === 'hasMany' || field.type === 'belongsTo' || field.type === 'hasOne') {
          isForward ? graph.setEdge(collection.name, field.target) : graph.setEdge(field.target, collection.name);
        }

        if (field.type === 'belongsToMany') {
          const throughCollection = field.through;

          if (isForward) {
            graph.setEdge(collection.name, throughCollection);
            graph.setEdge(throughCollection, field.target);
          } else {
            graph.setEdge(field.target, throughCollection);
            graph.setEdge(throughCollection, collection.name);
          }
        }
      }
    }

    return graph;
  }
}
