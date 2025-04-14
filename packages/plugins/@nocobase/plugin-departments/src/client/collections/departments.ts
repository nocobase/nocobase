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

export const departmentCollection = {
  name: 'departments',
  fields: [
    {
      type: 'bigInt',
      name: 'id',
      primaryKey: true,
      autoIncrement: true,
      interface: 'id',
      uiSchema: {
        type: 'id',
        title: '{{t("ID")}}',
      },
    },
    {
      name: 'title',
      type: 'string',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: '{{t("Department name")}}',
        'x-component': 'Input',
        required: true,
      },
    },
    {
      name: 'parent',
      type: 'belongsTo',
      interface: 'm2o',
      collectionName: 'departments',
      foreignKey: 'parentId',
      target: 'departments',
      targetKey: 'id',
      treeParent: true,
      uiSchema: {
        title: '{{t("Superior department")}}',
        'x-component': 'DepartmentSelect',
        // 'x-component-props': {
        //   multiple: false,
        //   fieldNames: {
        //     label: 'title',
        //     value: 'id',
        //   },
        // },
      },
    },
    {
      interface: 'm2m',
      type: 'belongsToMany',
      name: 'roles',
      target: 'roles',
      collectionName: 'departments',
      through: 'departmentsRoles',
      foreignKey: 'departmentId',
      otherKey: 'roleName',
      targetKey: 'name',
      sourceKey: 'id',
      uiSchema: {
        title: '{{t("Roles")}}',
        'x-component': 'AssociationField',
        'x-component-props': {
          multiple: true,
          fieldNames: {
            label: 'title',
            value: 'name',
          },
        },
      },
    },
    {
      interface: 'm2m',
      type: 'belongsToMany',
      name: 'owners',
      collectionName: 'departments',
      target: 'users',
      through: 'departmentsUsers',
      foreignKey: 'departmentId',
      otherKey: 'userId',
      targetKey: 'id',
      sourceKey: 'id',
      scope: {
        isOwner: true,
      },
      uiSchema: {
        title: '{{t("Owners")}}',
        'x-component': 'AssociationField',
        'x-component-props': {
          multiple: true,
          fieldNames: {
            label: 'nickname',
            value: 'id',
          },
        },
      },
    },
  ],
};
