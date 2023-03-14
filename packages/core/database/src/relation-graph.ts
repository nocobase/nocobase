import Database from './database';
import * as graphlib from 'graphlib';

class RelationGraph {
  constructor(public db: Database) {}

  static graphlib() {
    return graphlib;
  }

  static build(
    db: Database,
    options?: {
      direction?: 'forward' | 'reverse';
    },
  ) {
    const direction = options?.direction || 'forward';
    const isForward = direction === 'forward';

    const graph = new graphlib.Graph();

    for (const [_, collection] of db.collections) {
      graph.setNode(collection.name);
    }

    for (const [_, collection] of db.collections) {
      const parents = db.inheritanceMap.getParents(collection.name, { deep: false });

      for (const parent of parents) {
        isForward ? graph.setEdge(collection.name, parent) : graph.setEdge(parent, collection.name);
      }

      for (const [_, field] of collection.fields) {
        if (field.type === 'hasMany' || field.type === 'belongsTo' || field.type === 'hasOne') {
          isForward ? graph.setEdge(collection.name, field.target) : graph.setEdge(field.target, collection.name);
        }

        if (field.type === 'belongsToMany') {
          const throughCollection = db.getCollection(field.through);
          if (isForward) {
            graph.setEdge(collection.name, throughCollection.name);
            graph.setEdge(throughCollection.name, field.target);
          } else {
            graph.setEdge(field.target, throughCollection.name);
            graph.setEdge(throughCollection.name, collection.name);
          }
        }
      }
    }

    return graph;
  }

  static preOrder(graph, node) {
    return RelationGraph.graphlib().alg.preorder(graph, node);
  }

  static postOrder(graph, node) {
    return RelationGraph.graphlib().alg.postorder(graph, node);
  }

  preOrder(
    node,
    options?: {
      direction?: 'forward' | 'reverse';
    },
  ) {
    const graph = RelationGraph.build(this.db, options);
    return RelationGraph.preOrder(graph, node);
  }
}

export default RelationGraph;
