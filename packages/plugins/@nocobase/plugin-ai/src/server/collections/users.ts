/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { extendCollection } from '@nocobase/database';

export default extendCollection({
  name: 'users',
  fields: [
    {
      type: 'belongsToMany',
      name: 'aiEmployees',
      target: 'aiEmployees',
      foreignKey: 'userId',
      otherKey: 'aiEmployee',
      onDelete: 'CASCADE',
      sourceKey: 'id',
      targetKey: 'username',
      through: 'usersAiEmployees',
    },
  ],
});
