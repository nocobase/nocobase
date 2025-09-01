/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DataTypes } from '@nocobase/database';
import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';
import Migration from '../../migrations/migrate-main-department-id-20250828100101';

describe('migrate mainDepartmentId from departmentsUsers.isMain', () => {
  let app: MockServer;
  let db: MockDatabase;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['error-handler', 'field-sort', 'data-source-main', 'users', 'departments'],
    });
    db = app.db;
  });

  afterEach(async () => {
    if (app) {
      await app.destroy();
    }
  });

  it('should migrate isMain=true to users.mainDepartmentId and convert field to belongsTo', async () => {
    const dept = await db.getRepository('departments').create({ values: { title: 'Dept A' } });
    const user = await db.getRepository('users').create({ values: { username: 'user1' } });

    // Add legacy isMain column to departmentsUsers
    const throughModel = db.getModel('departmentsUsers');
    const qi = db.sequelize.getQueryInterface();
    await qi.addColumn(throughModel.getTableName() as any, 'isMain', {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: null,
    } as any);

    // Create the join row, then set isMain=true
    await db.getRepository('departmentsUsers').create({
      values: {
        departmentId: dept.get('id'),
        userId: user.get('id'),
        isOwner: false,
      },
    });
    await qi.bulkUpdate(
      throughModel.getTableName() as any,
      { isMain: true },
      { departmentId: dept.get('id'), userId: user.get('id') },
      {},
    );

    const fieldsRepo = db.getRepository('fields');

    // departmentsUsers.isMain field (will be removed by migration)
    await fieldsRepo.create({
      values: {
        collectionName: 'departmentsUsers',
        name: 'isMain',
        type: 'boolean',
        interface: 'checkbox',
        options: {},
      },
    });

    // users.mainDepartment as old m2m (will be converted by migration)
    const mainDeptField = await fieldsRepo.findOne({
      filter: { collectionName: 'users', name: 'mainDepartment' },
    });
    if (mainDeptField) {
      await fieldsRepo.update({
        filter: { collectionName: 'users', name: 'mainDepartment' },
        values: {
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
        },
      });
    } else {
      await fieldsRepo.create({
        values: {
          collectionName: 'users',
          name: 'mainDepartment',
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
        },
      });
    }

    // Run migration directly
    const migration = new Migration({
      db: db as any,
      queryInterface: db.sequelize.getQueryInterface(),
      sequelize: db.sequelize,
    } as any);
    await migration.up();

    // Verify: user.mainDepartmentId was set
    const updatedUser = await db.getRepository('users').findOne({
      filterByTk: user.get('id'),
      fields: ['id', 'mainDepartmentId'],
    });
    expect(updatedUser?.get('mainDepartmentId')).toBe(dept.get('id'));

    // Verify: departmentsUsers.isMain field definition removed
    const isMainField = await fieldsRepo.findOne({
      filter: { collectionName: 'departmentsUsers', name: 'isMain' },
    });
    expect(isMainField).toBeNull();

    // Verify: users.mainDepartment converted to belongsTo (m2o) with foreignKey
    const convertedField = await fieldsRepo.findOne({
      filter: { collectionName: 'users', name: 'mainDepartment' },
    });
    expect(convertedField).toBeTruthy();
    expect(convertedField?.get('type')).toBe('belongsTo');
    expect(convertedField?.get('interface')).toBe('m2o');
    const opts = convertedField?.get('options') as any;
    expect(opts?.foreignKey).toBe('mainDepartmentId');
  });
});
