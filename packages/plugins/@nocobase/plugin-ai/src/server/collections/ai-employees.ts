/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { defineCollection } from '@nocobase/database';
import aiEmployees from '../../collections/ai-employees';

export default defineCollection({
  migrationRules: ['overwrite', 'schema-only'],
  autoGenId: false,
  sortable: true,
  ...aiEmployees,
  fields: [
    ...aiEmployees.fields,
    {
      name: 'userConfigs',
      type: 'hasMany',
      target: 'usersAiEmployees',
      sourceKey: 'username',
      foreignKey: 'aiEmployee',
      onDelete: 'CASCADE',
    },
    {
      type: 'belongsToMany',
      name: 'roles',
      through: 'rolesAiEmployees',
      target: 'roles',
      onDelete: 'CASCADE',
      foreignKey: 'aiEmployee',
      otherKey: 'roleName',
      sourceKey: 'username',
      targetKey: 'name',
    },
  ],
});
