import { Repository } from '@nocobase/database';
import { CollectionModel } from '../models/collection';
import { CollectionsGraph } from '@nocobase/utils';

interface LoadOptions {
  filter?: any;
  skipExist?: boolean;
}

export class CollectionRepository extends Repository {
  async load(options: LoadOptions = {}) {
    const { filter, skipExist } = options;
    const instances = (await this.find({ filter })) as CollectionModel[];

    const graphlib = CollectionsGraph.graphlib();

    const graph = new graphlib.Graph();

    const nameMap = {};

    for (const instance of instances) {
      graph.setNode(instance.get('name'));
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
            graph.setEdge(collectionName, throughName);
            graph.setEdge(field.options.target, throughName);
          }
        }
      }

      if (instance.get('inherits')) {
        for (const parent of instance.get('inherits')) {
          graph.setEdge(collectionName, parent);
        }
      }

      if (instance.get('view') && instance.get('sources')) {
        for (const source of instance.get('sources')) {
          graph.setEdge(collectionName, source);
        }
      }
    }

    const sortedNames = graphlib.alg.preorder(graph);

    for (const instanceName of sortedNames) {
      if (!nameMap[instanceName]) continue;
      await nameMap[instanceName].load({ skipExist });
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
