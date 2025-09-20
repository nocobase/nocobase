/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import Database, { Repository } from '@nocobase/database';
import Application from '@nocobase/server';
import { createApp } from './index';
import { uid } from '@nocobase/utils';

describe('load collections', function () {
  let db: Database;
  let app: Application;

  let collectionRepository: Repository;

  let fieldsRepository: Repository;

  beforeEach(async () => {
    app = await createApp({
      database: {
        tablePrefix: '',
      },
    });

    db = app.db;

    collectionRepository = db.getCollection('collections').repository;
    fieldsRepository = db.getCollection('fields').repository;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should load belongs to view collection', async () => {
    await collectionRepository.create({
      values: {
        name: 'groups',
        fields: [
          { name: 'id', type: 'bigInt', primaryKey: true, autoIncrement: true },
          { name: 'name', type: 'string' },
        ],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'users',
        fields: [
          { name: 'id', type: 'bigInt', primaryKey: true, autoIncrement: true },
          { name: 'name', type: 'string' },
          { type: 'belongsTo', name: 'group', foreignKey: 'groupId' },
        ],
      },
      context: {},
    });

    await db.getCollection('users').repository.create({
      updateAssociationValues: ['group'],
      values: {
        name: '张三',
        group: {
          name: '技术部',
        },
      },
    });

    const viewName = `test_view_${uid(6)}`;
    // create view from users
    const createSQL = `CREATE VIEW ${viewName} AS SELECT * FROM ${db.getCollection('groups').quotedTableName()}`;

    await db.sequelize.query(createSQL);

    await collectionRepository.create({
      values: {
        name: viewName,
        view: true,
        fields: [
          { name: 'id', source: 'groups.id', type: 'bigInt' },
          { name: 'name', source: 'groups.name', type: 'string' },
        ],
        schema: db.inDialect('postgres') ? 'public' : undefined,
      },
      context: {},
    });

    // create belongsTo relation in groups
    await fieldsRepository.create({
      values: {
        name: 'groupAlias',
        type: 'belongsTo',
        collectionName: 'users',
        target: viewName,
        foreignKey: 'groupId',
        targetKey: 'id',
      },
      context: {},
    });

    await app.runCommand('restart');

    db = app.db;

    const User = db.getCollection('users');

    expect(User.model.associations.groupAlias).toBeTruthy();
    const users = await db.getRepository('users').find({
      appends: ['groupAlias'],
    });

    expect(users[0].groupAlias.name).toBe('技术部');
  });

  it('should load collections has many to view collection', async () => {
    await collectionRepository.create({
      values: {
        name: 'groups',
        fields: [{ name: 'name', type: 'string' }],
      },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'users',
        fields: [
          { name: 'id', type: 'bigInt', primaryKey: true, autoIncrement: true },
          { name: 'name', type: 'string' },
          { type: 'belongsTo', name: 'group', foreignKey: 'groupId' },
        ],
      },
      context: {},
    });

    await db.getCollection('users').repository.create({
      updateAssociationValues: ['group'],
      values: {
        name: '张三',
        group: {
          name: '技术部',
        },
      },
    });

    const User = db.getCollection('users');

    const viewName = `test_view_${uid(6)}`;
    const assoc = User.model.associations.group;
    const foreignKey = assoc.foreignKey;
    const foreignField = User.model.rawAttributes[foreignKey].field;

    // create view from users
    const createSQL = `CREATE VIEW ${viewName} AS SELECT * FROM ${db.getCollection('users').quotedTableName()}`;

    await db.sequelize.query(createSQL);

    await collectionRepository.create({
      values: {
        name: viewName,
        view: true,
        fields: [
          { name: 'id', source: 'users.id', type: 'bigInt' },
          { name: 'groupId', source: 'users.groupId', type: 'bigInt' },
          { name: 'name', source: 'users.name', type: 'string' },
        ],
        schema: db.inDialect('postgres') ? 'public' : undefined,
      },
      context: {},
    });

    // create hasMany relation in groups
    await fieldsRepository.create({
      values: {
        name: 'users',
        type: 'hasMany',
        collectionName: 'groups',
        target: viewName,
        foreignKey: 'groupId',
        targetKey: 'id',
      },
      context: {},
    });

    await app.runCommand('restart');

    db = app.db;

    const group = db.getCollection('groups');
    expect(group.getField('users')).toBeTruthy();

    const groups = await db.getRepository('groups').find({
      appends: ['users'],
    });

    expect(groups[0].users.length).toBe(1);
  });

  it('should load has one association', async () => {
    await collectionRepository.create({
      values: {
        name: 'profiles',
        fields: [{ name: 'id', type: 'bigInt', primaryKey: true, autoIncrement: true }],
      },
      context: {},
    });

    await fieldsRepository.create({
      values: { type: 'string', name: 'userCode', collectionName: 'profiles' },
      context: {},
    });

    await collectionRepository.create({
      values: {
        name: 'users',
        fields: [
          { name: 'id', type: 'bigInt', primaryKey: true, autoIncrement: true },
          { name: 'name', type: 'string' },
        ],
      },
      context: {},
    });

    await fieldsRepository.create({
      values: { type: 'string', name: 'userCode', collectionName: 'users' },
      context: {},
    });

    await fieldsRepository.create({
      values: {
        type: 'hasOne',
        name: 'profile',
        foreignKey: 'userCode',
        sourceKey: 'userCode',
        collectionName: 'users',
        target: 'profiles',
      },
      context: {},
    });

    await app.runCommand('restart');
    db = app.db;

    const User = db.getCollection('users');
    expect(User.model.associations['profile']).toBeTruthy();
  });
});
