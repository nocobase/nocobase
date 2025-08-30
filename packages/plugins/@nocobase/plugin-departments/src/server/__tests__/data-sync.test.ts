/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import PluginUserDataSyncServer, { UserDataResourceManager } from '@nocobase/plugin-user-data-sync';
import { MockDatabase, MockServer, createMockServer } from '@nocobase/test';

describe('department data sync', async () => {
  let app: MockServer;
  let db: MockDatabase;
  let resourceManager: UserDataResourceManager;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['field-sort', 'user-data-sync', 'users', 'departments'],
    });
    db = app.db;
    const plugin = app.pm.get('user-data-sync') as PluginUserDataSyncServer;
    resourceManager = plugin.resourceManager;
  });

  afterEach(async () => {
    await db.clean({ drop: true });
    await app.destroy();
  });

  it('should create department', async () => {
    await resourceManager.updateOrCreate({
      sourceName: 'test',
      dataType: 'department',
      records: [
        {
          uid: '1',
          title: 'test',
        },
        {
          uid: '2',
          title: 'sub-test',
          parentUid: '1',
        },
      ],
    });
    const department = await db.getRepository('departments').findOne({
      filter: {
        title: 'test',
      },
      appends: ['children'],
    });
    expect(department).toBeTruthy();
    expect(department.title).toBe('test');
    expect(department.children).toHaveLength(1);
    expect(department.children[0].title).toBe('sub-test');
  });

  it('should update department', async () => {
    await resourceManager.updateOrCreate({
      sourceName: 'test',
      dataType: 'department',
      records: [
        {
          uid: '1',
          title: 'test',
        },
      ],
    });
    const department = await db.getRepository('departments').findOne({
      filter: {
        title: 'test',
      },
      appends: ['children'],
    });
    expect(department).toBeTruthy();
    expect(department.children).toHaveLength(0);
    await resourceManager.updateOrCreate({
      sourceName: 'test',
      dataType: 'department',
      records: [
        {
          uid: '1',
          title: 'test2',
        },
        {
          uid: '2',
          title: 'sub-test',
          parentUid: '1',
        },
      ],
    });
    const department2 = await db.getRepository('departments').findOne({
      filter: {
        id: department.id,
      },
      appends: ['children'],
    });
    expect(department2).toBeTruthy();
    expect(department2.title).toBe('test2');
    expect(department2.children).toHaveLength(1);
    await resourceManager.updateOrCreate({
      sourceName: 'test',
      dataType: 'department',
      records: [
        {
          uid: '2',
          title: 'sub-test',
        },
      ],
    });
    const department3 = await db.getRepository('departments').findOne({
      filter: {
        id: department2.children[0].id,
      },
      appends: ['parent'],
    });
    expect(department3).toBeTruthy();
    expect(department3.parent).toBeNull();
  });

  it('should update user department', async () => {
    await resourceManager.updateOrCreate({
      sourceName: 'test',
      dataType: 'department',
      records: [
        {
          uid: '12',
          title: 'test',
        },
      ],
    });
    const department = await db.getRepository('departments').findOne({
      filter: {
        title: 'test',
      },
    });
    expect(department).toBeTruthy();
    await resourceManager.updateOrCreate({
      sourceName: 'test',
      dataType: 'user',
      records: [
        {
          uid: '1',
          nickname: 'test',
          email: 'test@nocobase.com',
          departments: ['12'],
        },
      ],
    });
    const user = await db.getRepository('users').findOne({
      filter: {
        email: 'test@nocobase.com',
      },
      appends: ['departments'],
    });
    expect(user).toBeTruthy();
    expect(user.departments).toHaveLength(1);
    expect(user.departments[0].id).toBe(department.id);
    const departmentUser = await db.getRepository('departmentsUsers').findOne({
      filter: {
        departmentId: department.id,
        userId: user.id,
      },
    });
    expect(departmentUser).toBeTruthy();
    expect(departmentUser.isOwner).toBe(false);
    expect(user.mainDepartmentId).toBeNull();

    await resourceManager.updateOrCreate({
      sourceName: 'test',
      dataType: 'user',
      records: [
        {
          uid: '1',
          nickname: 'test',
          email: 'test@nocobase.com',
          departments: [
            {
              uid: '12',
              isOwner: true,
              isMain: true,
            },
          ],
        },
      ],
    });
    const departmentUser2 = await db.getRepository('departmentsUsers').findOne({
      filter: {
        departmentId: department.id,
        userId: user.id,
      },
    });
    expect(departmentUser2).toBeTruthy();
    expect(departmentUser2.isOwner).toBe(true);

    const updatedUser = await db.getRepository('users').findOne({
      filterByTk: user.id,
      fields: ['id', 'mainDepartmentId'],
    });
    expect(updatedUser.mainDepartmentId).toBe(department.id);

    await resourceManager.updateOrCreate({
      sourceName: 'test',
      dataType: 'user',
      records: [
        {
          uid: '2',
          nickname: 'test2',
          email: 'test2@nocobase.com',
          departments: [
            {
              uid: '12',
              isOwner: true,
              isMain: false,
            },
          ],
        },
      ],
    });
    const user2 = await db.getRepository('users').findOne({
      filter: {
        email: 'test2@nocobase.com',
      },
      appends: ['departments'],
    });
    expect(user2).toBeTruthy();
    expect(user2.departments).toHaveLength(1);
    expect(user2.departments[0].id).toBe(department.id);
    const departmentUser3 = await db.getRepository('departmentsUsers').findOne({
      filter: {
        departmentId: department.id,
        userId: user2.id,
      },
    });
    expect(departmentUser3).toBeTruthy();
    expect(departmentUser3.isOwner).toBe(true);
    expect(user2.mainDepartmentId).toBeNull();
  });

  it('should update department custom field', async () => {
    const departmemntCollection = db.getCollection('departments');
    departmemntCollection.addField('customField', { type: 'string' });
    await db.sync({
      alter: true,
    });
    await resourceManager.updateOrCreate({
      sourceName: 'test',
      dataType: 'department',
      records: [
        {
          uid: '1',
          title: 'test',
          customField: 'testField',
        },
      ],
    });
    const department = await db.getRepository('departments').findOne({
      filter: {
        title: 'test',
      },
    });
    expect(department).toBeTruthy();
    expect(department.customField).toBe('testField');
    await resourceManager.updateOrCreate({
      sourceName: 'test',
      dataType: 'department',
      records: [
        {
          uid: '1',
          title: 'test',
          customField: 'testField2',
        },
      ],
    });
    const department2 = await db.getRepository('departments').findOne({
      filter: {
        id: department.id,
      },
    });
    expect(department2).toBeTruthy();
    expect(department2.customField).toBe('testField2');
  });
});
