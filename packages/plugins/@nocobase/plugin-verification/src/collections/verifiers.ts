/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export default {
  name: 'verifiers',
  autoGenId: false,
  fields: [
    {
      type: 'uid',
      name: 'name',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'title',
    },
    {
      type: 'string',
      name: 'verificationType',
    },
    {
      type: 'string',
      name: 'description',
    },
    {
      type: 'jsonb',
      name: 'options',
    },
    {
      interface: 'm2m',
      type: 'belongsToMany',
      name: 'users',
      target: 'users',
      foreignKey: 'verifier',
      otherKey: 'userId',
      onDelete: 'CASCADE',
      sourceKey: 'name',
      targetKey: 'id',
      through: 'usersVerifiers',
    },
  ],
};
