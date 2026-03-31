/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';
import Migration from '../../migrations/migrate-main-department-id-20250828100101';

describe('migrate mainDepartmentId from departmentsUsers.isMain', () => {
  let app: MockServer;
  let db: MockDatabase;
  let deptId: number;
  let userId: number;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['error-handler', 'field-sort', 'data-source-main', 'users'],
    });
    db = app.db;

    // 1. Define "Old" Collection Structure (with isMain) to setup DB tables
    db.collection({
      name: 'departments',
      fields: [
        { type: 'bigInt', name: 'id', primaryKey: true, autoIncrement: true },
        { type: 'string', name: 'title' },
      ],
    });

    db.collection({
      name: 'departmentsUsers',
      fields: [
        { type: 'bigInt', name: 'departmentId' },
        { type: 'bigInt', name: 'userId' },
        { type: 'boolean', name: 'isOwner' },
        { type: 'boolean', name: 'isMain' }, // Defined initially to create column in DB
      ],
    });

    await db.sync();

    // 2. Insert Test Data
    const dept = await db.getRepository('departments').create({ values: { title: 'Dept A' } });
    const user = await db.getRepository('users').create({ values: { username: 'user1' } });
    deptId = dept.get('id');
    userId = user.get('id');

    // Add mainDepartmentId field to users (target of migration)
    const usersCollection = db.getCollection('users');
    if (!usersCollection.hasField('mainDepartmentId')) {
      usersCollection.addField('mainDepartmentId', { type: 'bigInt' });
      await usersCollection.sync();
    }

    // Insert relationship with isMain=true
    await db.getRepository('departmentsUsers').create({
      values: {
        departmentId: deptId,
        userId: userId,
        isOwner: false,
        isMain: true,
      },
    });

    // 3. Setup Fields Table (Metadata) to simulate old configuration
    const fieldsRepo = db.getRepository('fields');

    // Metadata for departmentsUsers.isMain
    await fieldsRepo.create({
      values: {
        collectionName: 'departmentsUsers',
        name: 'isMain',
        type: 'boolean',
        interface: 'checkbox',
        options: {},
      },
    });

    // Metadata for users.mainDepartment (Old M2M configuration)
    const mainDeptField = await fieldsRepo.findOne({
      filter: { collectionName: 'users', name: 'mainDepartment' },
    });

    const oldM2MConfig = {
      type: 'belongsToMany',
      interface: 'm2m',
      options: {
        target: 'departments',
        through: 'departmentsUsers',
        foreignKey: 'userId',
        otherKey: 'departmentId',
        sourceKey: 'id',
        targetKey: 'id',
        throughScope: { isMain: true },
      },
    };

    if (mainDeptField) {
      await mainDeptField.update(oldM2MConfig);
    } else {
      await fieldsRepo.create({
        values: {
          collectionName: 'users',
          name: 'mainDepartment',
          ...oldM2MConfig,
        },
      });
    }
  });

  afterEach(async () => {
    if (app) {
      await app.destroy();
    }
  });

  it('should migrate mainDepartmentId from departmentsUsers.isMain', async () => {
    // Verify ORM has the field
    expect(db.getCollection('departmentsUsers').hasField('isMain')).toBe(true);

    // Run Migration
    const migration = new Migration({
      db: db as any,
      queryInterface: db.sequelize.getQueryInterface(),
      sequelize: db.sequelize,
    } as any);
    await migration.up();

    // Verify Results
    await verifyMigrationSuccess(db, userId, deptId);
  });
});

async function verifyMigrationSuccess(db: MockDatabase, userId: number, deptId: number) {
  const fieldsRepo = db.getRepository('fields');

  // 1. user.mainDepartmentId should be set
  const updatedUser = await db.getRepository('users').findOne({
    filterByTk: userId,
    fields: ['id', 'mainDepartmentId'],
  });
  expect(updatedUser?.get('mainDepartmentId')).toBe(deptId);

  // 2. departmentsUsers.isMain field definition should be removed from fields table
  const isMainField = await fieldsRepo.findOne({
    filter: { collectionName: 'departmentsUsers', name: 'isMain' },
  });
  expect(isMainField).toBeNull();

  // 3. users.mainDepartment converted to belongsTo (m2o)
  const convertedField = await fieldsRepo.findOne({
    filter: { collectionName: 'users', name: 'mainDepartment' },
  });
  expect(convertedField).toBeTruthy();
  expect(convertedField?.get('type')).toBe('belongsTo');
  expect(convertedField?.get('interface')).toBe('m2o');
  const opts = convertedField?.get('options') as any;
  expect(opts?.foreignKey).toBe('mainDepartmentId');
}
