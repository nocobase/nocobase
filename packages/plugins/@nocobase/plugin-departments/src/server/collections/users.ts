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

import { extendCollection } from '@nocobase/database';

export const departmentsField = {
  collectionName: 'users',
  interface: 'm2m',
  type: 'belongsToMany',
  name: 'departments',
  target: 'departments',
  foreignKey: 'userId',
  otherKey: 'departmentId',
  onDelete: 'CASCADE',
  sourceKey: 'id',
  targetKey: 'id',
  through: 'departmentsUsers',
  uiSchema: {
    type: 'm2m',
    title: '{{t("Departments")}}',
    'x-component': 'UserDepartmentsField',
    'x-component-props': {
      multiple: true,
      fieldNames: {
        label: 'title',
        value: 'name',
      },
    },
  },
};

export const mainDepartmentField = {
  collectionName: 'users',
  interface: 'm2m',
  type: 'belongsToMany',
  name: 'mainDepartment',
  target: 'departments',
  foreignKey: 'userId',
  otherKey: 'departmentId',
  onDelete: 'CASCADE',
  sourceKey: 'id',
  targetKey: 'id',
  through: 'departmentsUsers',
  throughScope: {
    isMain: true,
  },
  uiSchema: {
    type: 'm2m',
    title: '{{t("Main department")}}',
    'x-component': 'UserMainDepartmentField',
    'x-component-props': {
      multiple: false,
      fieldNames: {
        label: 'title',
        value: 'name',
      },
    },
  },
};

export default extendCollection({
  name: 'users',
  fields: [departmentsField, mainDepartmentField],
});
