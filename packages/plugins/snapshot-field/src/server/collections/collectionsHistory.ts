// import { CollectionOptions } from '@nocobase/client';
// import { collectionsCollection } from '@nocobase/plugin-collection-manager';

// export default {
//   ...collectionsCollection,
//   name: 'collectionsHistory',
//   title: 'Collection snapshot',
//   fields: [
//     ...collectionsCollection.fields.map((field) =>
//       field.name === 'fields' ? { ...field, target: 'fieldsHistory' } : field,
//     ),
//   ],
// } as CollectionOptions;

import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'collectionsHistory',
  title: '数据表配置',
  sortable: 'sort',
  autoGenId: false,
  model: 'CollectionModel',
  repository: 'CollectionRepository',
  timestamps: false,
  filterTargetKey: 'name',
  fields: [
    {
      type: 'uid',
      name: 'key',
      primaryKey: true,
    },
    {
      type: 'uid',
      name: 'name',
      unique: true,
      prefix: 't_',
    },
    {
      type: 'string',
      name: 'title',
      required: true,
    },
    {
      type: 'boolean',
      name: 'inherit',
      defaultValue: false,
    },
    {
      type: 'boolean',
      name: 'hidden',
      defaultValue: false,
    },
    {
      type: 'json',
      name: 'options',
      defaultValue: {},
    },
    {
      type: 'hasMany',
      name: 'fields',
      target: 'fieldsHistory',
      sourceKey: 'name',
      targetKey: 'name',
      foreignKey: 'collectionName',
      sortBy: 'sort',
    },
  ],
} as CollectionOptions;
