import lodash from 'lodash';
import { Model } from '../model';

import { CollectionExtender } from '.';

export class AdjacencyListExtender implements CollectionExtender {
  static condition(options) {
    return options.tree;
  }

  apply(collection) {
    this.treeHook(collection);
  }

  treeHook(collection) {
    if (!collection.options.tree) {
      return;
    }

    collection.on('field.beforeAdd', (name, opts, { collection }) => {
      console.log('field beforeAdd');
      if (!collection.options.tree) {
        return;
      }

      if (name === 'parent' || name === 'children') {
        opts.target = collection.name;
        opts.foreignKey = 'parentId';
      }
    });

    collection.model.afterFind(async (instances, options: any) => {
      if (!options.tree) {
        return;
      }
      const arr: Model[] = Array.isArray(instances) ? instances : [instances];
      let index = 0;
      for (const instance of arr) {
        const opts = {
          ...lodash.pick(options, ['tree', 'fields', 'appends', 'except', 'sort']),
        };
        let __index = `${index++}`;
        if (options.parentIndex) {
          __index = `${options.parentIndex}.${__index}`;
        }
        instance.setDataValue('__index', __index);
        const children = await collection.repository.find({
          filter: {
            parentId: instance.id,
          },
          transaction: options.transaction,
          ...opts,
          // @ts-ignore
          parentIndex: `${__index}.children`,
          context: options.context,
        });
        if (children?.length > 0) {
          instance.setDataValue(
            'children',
            children.map((r) => r.toJSON()),
          );
        }
      }
    });
  }
}
