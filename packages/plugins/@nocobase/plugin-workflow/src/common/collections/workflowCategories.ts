/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  dumpRules: 'required',
  migrationRules: ['overwrite', 'schema-only'],
  name: 'workflowCategories',
  shared: true,
  fields: [
    {
      type: 'string',
      name: 'title',
      interface: 'input',
      uiSchema: {
        title: '{{t("Title")}}',
        type: 'string',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      type: 'string',
      name: 'color',
      defaultValue: 'default',
    },
    {
      type: 'belongsToMany',
      name: 'workflows',
      target: 'workflows',
      foreignKey: 'categoryId',
      otherKey: 'workflowId',
      targetKey: 'id',
      through: 'workflowCategoryRelations',
    },
    {
      type: 'sort',
      name: 'sort',
    },
  ],
};
