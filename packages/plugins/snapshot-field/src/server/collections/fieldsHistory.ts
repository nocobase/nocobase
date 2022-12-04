// import { CollectionOptions } from '@nocobase/database';
// import { fieldsCollection } from '@nocobase/plugin-collection-manager';

// export default {
//   ...fieldsCollection,
//   name: 'fieldsHistory',
//   title: '{{t("Fields history")}}',
//   fields: [
//     ...fieldsCollection.fields.map((field) =>
//       field.name === 'collection' ? { ...field, target: 'collectionsHistory' } : field,
//     ),
//   ],
// } as CollectionOptions;

import { CollectionOptions } from '@nocobase/database';

export default {
  name: 'fieldsHistory',
  title: '{{t("Fields history")}}',
  autoGenId: false,
  model: 'FieldModel',
  timestamps: false,
  sortable: {
    name: 'sort',
    scopeKey: 'collectionName',
  },
  indexes: [
    {
      type: 'UNIQUE',
      fields: ['collectionName', 'name'],
    },
  ],
  fields: [
    {
      type: 'uid',
      name: 'key',
      primaryKey: true,
    },
    {
      type: 'uid',
      name: 'name',
      prefix: 'f_',
    },
    {
      type: 'string',
      name: 'type',
    },
    {
      type: 'string',
      name: 'interface',
      allowNull: true,
    },
    {
      type: 'belongsTo',
      name: 'collection',
      target: 'collectionsHistory',
      foreignKey: 'collectionName',
      targetKey: 'name',
      onDelete: 'CASCADE',
    },
    {
      type: 'hasMany',
      name: 'children',
      target: 'fieldsHistory',
      sourceKey: 'key',
      foreignKey: 'parentKey',
    },
    {
      type: 'hasOne',
      name: 'reverseField',
      target: 'fieldsHistory',
      sourceKey: 'key',
      foreignKey: 'reverseKey',
    },
    {
      type: 'belongsTo',
      name: 'uiSchema',
      target: 'uiSchemas',
      foreignKey: 'uiSchemaUid',
    },
    {
      type: 'json',
      name: 'options',
      defaultValue: {},
    },
  ],
} as CollectionOptions;
