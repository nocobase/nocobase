import { getConfigurableProperties } from './properties';
import { ICollectionTemplate } from './types';

export const tree: ICollectionTemplate = {
  name: 'tree',
  title: '{{t("Tree collection")}}',
  order: 3,
  color: 'blue',
  default: {
    tree: 'adjacencyList',
    fields: [
      {
        interface: 'integer',
        name: 'parentId',
        type: 'bigInt',
        isForeignKey: true,
        uiSchema: {
          type: 'number',
          title: '{{t("Parent ID")}}',
          'x-component': 'InputNumber',
          'x-read-pretty': true,
        },
      },
      {
        interface: 'm2o',
        type: 'belongsTo',
        name: 'parent',
        foreignKey: 'parentId',
        uiSchema: {
          title: '{{t("Parent")}}',
          'x-component': 'RecordPicker',
          'x-component-props': {
            // mode: 'tags',
            multiple: false,
            fieldNames: {
              label: 'id',
              value: 'id',
            },
          },
        },
      },
      {
        interface: 'o2m',
        type: 'hasMany',
        name: 'children',
        foreignKey: 'parentId',
        uiSchema: {
          title: '{{t("Children")}}',
          'x-component': 'RecordPicker',
          'x-component-props': {
            // mode: 'tags',
            multiple: true,
            fieldNames: {
              label: 'id',
              value: 'id',
            },
          },
        },
      },
    ],
  },
  events: {
    beforeSubmit(values) {
      if (Array.isArray(values?.fields)) {
        values?.fields.map((f) => {
          f.target = values.name;
        });
      }
    },
  },
  configurableProperties: getConfigurableProperties('title', 'name', 'inherits', 'category', 'moreOptions'),
};
