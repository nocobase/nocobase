import { Repository, Transactionable } from '@nocobase/database';
import { CollectionModel } from '../models/collection';
import { CollectionsGraph } from '@nocobase/utils';

interface LoadOptions extends Transactionable {
  filter?: any;
  skipExist?: boolean;
  replaceCollection?: boolean;
}

export class CollectionRepository extends Repository {
  async load(options: LoadOptions = {}) {
    const { filter, skipExist, transaction, replaceCollection } = options;
    const instances = (await this.find({ filter, transaction })) as CollectionModel[];

    if (replaceCollection) {
      instances.forEach((instance) => {
        this.database.removeCollection(instance.get('name'));
      });
    }
    const graphlib = CollectionsGraph.graphlib();

    const graph = new graphlib.Graph();

    const nameMap: {
      [key: string]: CollectionModel;
    } = {};

    const viewCollections = [];

    for (const instance of instances) {
      graph.setNode(instance.get('name'));
      if (instance.get('view')) {
        viewCollections.push(instance.get('name'));
      }
    }

    for (const instance of instances) {
      const collectionName = instance.get('name');

      nameMap[collectionName] = instance;

      // @ts-ignore
      const fields = await instance.getFields();
      for (const field of fields) {
        if (field['type'] === 'belongsToMany') {
          const throughName = field.options.through;
          if (throughName) {
            graph.setEdge(throughName, collectionName);
            graph.setEdge(throughName, field.options.target);
          }
        }
      }

      if (instance.get('inherits')) {
        for (const parent of instance.get('inherits')) {
          graph.setEdge(parent, collectionName);
        }
      }
    }

    if (graph.nodeCount() === 0) return;

    if (!graphlib.alg.isAcyclic(graph)) {
      const cycles = graphlib.alg.findCycles(graph);
      throw new Error(`Cyclic dependencies: ${cycles.map((cycle) => cycle.join(' -> ')).join(', ')}`);
    }

    const sortedNames = graphlib.alg.topsort(graph);

    for (const instanceName of sortedNames) {
      if (!nameMap[instanceName]) continue;

      await nameMap[instanceName].load({
        skipExist,
        transaction,
        skipField: viewCollections.includes(instanceName),
        replaceCollection: options.replaceCollection,
      });
    }

    // load view fields
    for (const viewCollectionName of viewCollections) {
      await nameMap[viewCollectionName].loadFields({
        transaction,
      });
    }
  }

  async db2cm(collectionName: string) {
    const collection = this.database.getCollection(collectionName);

    // skip if collection already exists
    if (await this.findOne({ filter: { name: collectionName } })) {
      return;
    }

    const options = collection.options;
    const fields = [];
    for (const [name, field] of collection.fields) {
      fields.push({
        name,
        ...field.options,
      });
    }

    await this.create({
      values: {
        ...options,
        fields,
        from: 'db2cm',
      },
    });
  }
}
