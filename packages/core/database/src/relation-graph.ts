import Database from './database';
import * as graphlib from 'graphlib';

class RelationGraph {
  constructor(public db: Database) {}

  static graphlib() {
    return graphlib;
  }

  static build(db: Database) {
    const graph = new graphlib.Graph();

    for (const [_, collection] of db.collections) {
      graph.setNode(collection.name);
    }

    for (const [_, collection] of db.collections) {
      for (const [_, field] of collection.fields) {
        if (field.type === 'hasMany' || field.type === 'belongsTo' || field.type === 'hasOne') {
          graph.setEdge(collection.name, field.target);
        }

        if (field.type === 'belongsToMany') {
          const throughCollection = db.getCollection(field.through);
          graph.setEdge(collection.name, throughCollection.name);
          graph.setEdge(throughCollection.name, field.target);
        }
      }
    }

    return graph;
  }

  static preOrder(graph, node) {
    return RelationGraph.graphlib().alg.preorder(graph, node);
  }

  preOrder(node) {
    const graph = RelationGraph.build(this.db);
    return RelationGraph.preOrder(graph, node);
  }
}

export default RelationGraph;
