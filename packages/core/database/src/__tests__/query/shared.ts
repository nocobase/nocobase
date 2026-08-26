/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockDatabase } from '../../mock-database';

export async function createQueryTestDatabase() {
  const db = await createMockDatabase();
  await db.clean({ drop: true });

  db.options.underscored = true;

  db.collection({
    name: 'roles',
    createdBy: false,
    updatedBy: false,
    fields: [{ name: 'name', type: 'string' }],
  });

  db.collection({
    name: 'departments',
    createdBy: false,
    updatedBy: false,
    fields: [
      { name: 'name', type: 'string' },
      {
        name: 'owners',
        type: 'belongsToMany',
        target: 'users',
        through: 'departmentsUsers',
      },
    ],
  });

  db.collection({
    name: 'users',
    createdBy: false,
    updatedBy: false,
    fields: [
      { name: 'name', type: 'string' },
      { name: 'age', type: 'integer' },
      { name: 'createdAt', type: 'date' },
      {
        name: 'createdBy',
        type: 'belongsTo',
        target: 'users',
        foreignKey: 'createdById',
        targetKey: 'id',
      },
      {
        name: 'roles',
        type: 'belongsToMany',
        target: 'roles',
        through: 'rolesUsers',
      },
      {
        name: 'departments',
        type: 'belongsToMany',
        target: 'departments',
        through: 'departmentsUsers',
      },
    ],
  });

  await db.sync();
  return db;
}

export type QueryTestDatabase = Awaited<ReturnType<typeof createQueryTestDatabase>>;

export async function closeQueryTestDatabase(db?: QueryTestDatabase) {
  if (db) {
    await db.close();
  }
}
