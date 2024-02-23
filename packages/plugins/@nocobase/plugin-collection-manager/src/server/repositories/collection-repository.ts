import { Repository } from '@nocobase/database';
import { Application } from '@nocobase/server';
import { CollectionsGraph } from '@nocobase/utils';
import lodash from 'lodash';
import { CollectionModel } from '../models/collection';

interface LoadOptions {
  filter?: any;
  skipExist?: boolean;
}

export class CollectionRepository extends Repository {
  private app: Application;

  setApp(app) {
    this.app = app;
  }

  async load(options: LoadOptions = {}) {
    const { filter, skipExist } = options;
    const instances = (await this.find({ filter, appends: ['fields'] })) as CollectionModel[];

    const graphlib = CollectionsGraph.graphlib();

    const graph = new graphlib.Graph();

    const nameMap: {
      [key: string]: CollectionModel;
    } = {};

    const viewCollections = [];

    // set all graph nodes
    for (const instance of instances) {
      graph.setNode(instance.get('name'));
      if (instance.get('view') || instance.get('sql')) {
        viewCollections.push(instance.get('name'));
      }
    }

    // set graph edges by inherits
    for (const instance of instances) {
      const collectionName = instance.get('name');

      nameMap[collectionName] = instance;

      if (instance.get('inherits')) {
        for (const parent of instance.get('inherits')) {
          graph.setEdge(parent, collectionName);
        }
      }
    }

    if (graph.nodeCount() === 0) return;

    // check if graph is acyclic, throw error if not
    if (!graphlib.alg.isAcyclic(graph)) {
      const cycles = graphlib.alg.findCycles(graph);
      throw new Error(`Cyclic dependencies: ${cycles.map((cycle) => cycle.join(' -> ')).join(', ')}`);
    }

    // sort graph nodes
    const sortedNames = graphlib.alg.topsort(graph);

    const lazyCollectionFields = new Map<string, Array<string>>();

    for (const instanceName of sortedNames) {
      if (!nameMap[instanceName]) continue;

      // skip load collection field
      // can be a true value or an array of field names
      const skipField = (() => {
        // skip load collection field if collection is view
        if (viewCollections.includes(instanceName)) {
          return true;
        }

        const fields = nameMap[instanceName].get('fields');

        return fields
          .filter((field) => field['type'] === 'belongsTo' || field['type'] === 'belongsToMany')
          .map((field) => field.get('name'));
      })();

      if (lodash.isArray(skipField) && skipField.length) {
        lazyCollectionFields.set(instanceName, skipField);
      }

      this.database.logger.debug(`load collection`, {
        instanceName,
        submodule: 'CollectionRepository',
        method: 'load',
      });
      this.app.setMaintainingMessage(`load ${instanceName} collection`);

      await nameMap[instanceName].load({ skipField });
    }

    // load view fields
    for (const viewCollectionName of viewCollections) {
      this.database.logger.debug(`load collection fields`, {
        submodule: 'CollectionRepository',
        method: 'load',
        viewCollectionName,
      });
      this.app.setMaintainingMessage(`load ${viewCollectionName} collection fields`);
      await nameMap[viewCollectionName].loadFields({});
    }

    // load lazy collection field
    for (const [collectionName, skipField] of lazyCollectionFields) {
      this.database.logger.debug(`load collection fields`, {
        submodule: 'CollectionRepository',
        method: 'load',
        collectionName,
      });
      this.app.setMaintainingMessage(`load ${collectionName} collection fields`);
      await nameMap[collectionName].loadFields({ includeFields: skipField });
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
