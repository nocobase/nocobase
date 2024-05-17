/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

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
  presetFieldsDisabledIncludes = ['id'];
  events = {
    beforeSubmit(values) {
      if (Array.isArray(values?.fields)) {
        values?.fields.map((f) => {
          if (!f.target && ['belongsToMany', 'belongsTo', 'hasMany', 'hasOne'].includes(f.type)) {
            f.target = values.name;
          }
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
