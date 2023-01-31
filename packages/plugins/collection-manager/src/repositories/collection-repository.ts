import { Repository } from '@nocobase/database';
import { CollectionModel } from '../models/collection';
import toposort from 'toposort';

interface LoadOptions {
  filter?: any;
  skipExist?: boolean;
}

export class CollectionRepository extends Repository {
  async load(options: LoadOptions = {}) {
    const { filter, skipExist } = options;
    const instances = (await this.find({ filter })) as CollectionModel[];

    const inheritedGraph = [];
    const throughModels = [];
    const generalModels = [];

    const nameMap = {};

    for (const instance of instances) {
      nameMap[instance.get('name')] = instance;
      // @ts-ignore
      const fields = await instance.getFields();
      for (const field of fields) {
        if (field['type'] === 'belongsToMany') {
          const throughName = field.options.through;
          if (throughName) {
            throughModels.push(throughName);
          }
        }
      }

      if (instance.get('inherits')) {
        for (const parent of instance.get('inherits')) {
          inheritedGraph.push([parent, instance.get('name')]);
        }
      } else {
        generalModels.push(instance.get('name'));
      }
    }

    generalModels.sort((a, b) => {
      if (throughModels.includes(a)) {
        return -1;
      }

      return 1;
    });

    const sortedNames = [...toposort(inheritedGraph), ...generalModels];

    for (const instanceName of sortedNames) {
      await nameMap[instanceName].load({ skipExist });
    }
  }

  async db2cm(collectionName: string) {
    const collection = this.database.getCollection(collectionName);
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
      },
    });
  }
}
