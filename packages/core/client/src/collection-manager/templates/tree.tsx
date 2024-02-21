import { CollectionTemplate } from '../../data-source/collection-template/CollectionTemplate';
import { getConfigurableProperties } from './properties';

export class TreeCollectionTemplate extends CollectionTemplate {
  name = 'tree';
  title = '{{t("Tree collection")}}';
  order = 3;
  color = 'blue';
  default = {
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
        treeParent: true,
        onDelete: 'CASCADE',
        uiSchema: {
          title: '{{t("Parent")}}',
          'x-component': 'AssociationField',
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
        treeChildren: true,
        onDelete: 'CASCADE',
        uiSchema: {
          title: '{{t("Children")}}',
          'x-component': 'AssociationField',
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
  };
  events = {
    beforeSubmit(values) {
      if (Array.isArray(values?.fields)) {
        values?.fields.map((f) => {
          f.target = values.name;
        });
      }
    },
  };
  configurableProperties = getConfigurableProperties(
    'title',
    'name',
    'inherits',
    'category',
    'description',
    'presetFields',
  );
}
