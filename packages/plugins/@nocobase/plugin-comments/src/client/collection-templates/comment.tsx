/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This program is offered under a commercial license.
 * For more information, see <https://www.nocobase.com/agreement>
 */

import { CollectionTemplate, ICollectionTemplate, getConfigurableProperties } from '@nocobase/client';
import { generateNTemplate } from '../locale';

export class CommentCollectionTemplate extends CollectionTemplate {
  name = 'comment';
  title = generateNTemplate('Comment Collection');
  order = 2;
  color = 'orange';
  default = {
    fields: [
      {
        name: 'content',
        type: 'text',
        length: 'long',
        interface: 'vditor',
        deletable: false,
        uiSchema: {
          type: 'string',
          title: generateNTemplate('Comment Content'),
          interface: 'vditor',
          'x-component': 'MarkdownVditor',
        },
      },
      // {
      //   interface: 'integer',
      //   name: 'parentId',
      //   type: 'bigInt',
      //   isForeignKey: true,
      //   deletable: false,
      //   uiSchema: {
      //     type: 'number',
      //     title: '{{t("Parent ID")}}',
      //     'x-component': 'InputNumber',
      //     'x-read-pretty': true,
      //   },
      // },
      // {
      //   interface: 'm2o',
      //   type: 'belongsTo',
      //   name: 'parent',
      //   foreignKey: 'parentId',
      //   treeParent: true,
      //   onDelete: 'CASCADE',
      //   deletable: false,
      //   uiSchema: {
      //     title: '{{t("Parent")}}',
      //     'x-component': 'AssociationField',
      //     'x-component-props': {
      //       // mode: 'tags',
      //       multiple: false,
      //       fieldNames: {
      //         label: 'id',
      //         value: 'id',
      //       },
      //     },
      //   },
      // },
      // {
      //   interface: 'o2m',
      //   type: 'hasMany',
      //   name: 'children',
      //   foreignKey: 'parentId',
      //   treeChildren: true,
      //   onDelete: 'CASCADE',
      //   deletable: false,
      //   uiSchema: {
      //     title: '{{t("Children")}}',
      //     'x-component': 'AssociationField',
      //     'x-component-props': {
      //       // mode: 'tags',
      //       multiple: true,
      //       fieldNames: {
      //         label: 'id',
      //         value: 'id',
      //       },
      //     },
      //   },
      // },
    ],
  };
  // events = {
  //   beforeSubmit(values) {
  //     if (Array.isArray(values?.fields)) {
  //       values?.fields.map((f) => {
  //         f.target = values.name;
  //       });
  //     }
  //   },
  // };
  presetFieldsDisabled = true;
  configurableProperties = getConfigurableProperties(
    'title',
    'name',
    'inherits',
    'category',
    'description',
    'presetFields',
  );
}
