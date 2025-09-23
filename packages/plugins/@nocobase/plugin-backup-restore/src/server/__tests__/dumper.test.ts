/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Database } from '@nocobase/database';
import { MockServer } from '@nocobase/test';
import fs from 'fs';
import * as process from 'node:process';
import path from 'path';
import { Dumper } from '../dumper';
import { Restorer } from '../restorer';
import createApp from './index';

describe('dumper', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createApp();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it.skip('should restore from file', async () => {
    const file = '/home/chareice/Downloads/backup_20231121_100606_4495.nbdump';
    const restorer = new Restorer(app, {
      backUpFilePath: file,
    });

    await restorer.restore({
      groups: new Set(['meta', 'business']),
    });
  });

  it.skip('should restore from version 0.21 backup file', async () => {
    const file = path.resolve(__dirname, 'files', 'backup_20240429_110942_7061.nbdump');

    const restorer = new Restorer(app, {
      backUpFilePath: file,
    });

    const { dumpableCollectionsGroupByGroup } = await restorer.parseBackupFile();

    await restorer.restore({
      groups: new Set(Object.keys(dumpableCollectionsGroupByGroup)),
    });
  });

  it('should write sql content', async () => {
    const dumper = new Dumper(app);

    const result = await dumper.dump({
      groups: new Set(['required']),
    });

    const restorer = new Restorer(app, {
      backUpFilePath: result.filePath,
    });

    await restorer.restore({
      groups: new Set(['required']),
    });
  });

  it.runIf(process.env['DB_DIALECT'] === 'mysql')('should dump with table named by reserved word', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'update',
        tableName: 'update',
        autoGenId: false,
        fields: [
          {
            type: 'bigInt',
            name: 'id',
          },
          {
            type: 'string',
            name: 'name',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('update').create({
      values: {
        name: 'test',
      },
    });
    const dumper = new Dumper(app);

    db.getCollection('update').model['rawAttributes']['id'].autoIncrement = true;

    const result = await dumper.dump({
      groups: new Set(['required', 'custom']),
    });

    const restorer = new Restorer(app, {
      backUpFilePath: result.filePath,
    });

    await restorer.restore({
      groups: new Set(['required', 'custom']),
    });

    const testCollection = app.db.getCollection('update');
    const items = await testCollection.repository.find();
    expect(items.length).toBe(1);
  });

  it('should dump and restore date field', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'tests',
        fields: [
          {
            type: 'date',
            name: 'test_data',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('tests').create({
      values: {
        date: new Date(),
      },
    });

    const dumper = new Dumper(app);

    const result = await dumper.dump({
      groups: new Set(['required', 'custom']),
    });

    const restorer = new Restorer(app, {
      backUpFilePath: result.filePath,
    });

    await restorer.restore({
      groups: new Set(['required', 'custom']),
    });

    const testCollection = app.db.getCollection('tests');
    const items = await testCollection.repository.find();
    expect(items.length).toBe(1);
  });

  it('should dump and restore datetimeNoTz field', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'tests',
        fields: [
          {
            type: 'datetimeNoTz',
            name: 'test_data',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('tests').create({
      values: {
        test_data: '2013-10-10 12:11:00',
      },
    });

    const dumper = new Dumper(app);

    const result = await dumper.dump({
      groups: new Set(['required', 'custom']),
    });

    const restorer = new Restorer(app, {
      backUpFilePath: result.filePath,
    });

    await restorer.restore({
      groups: new Set(['required', 'custom']),
    });

    const testCollection = app.db.getCollection('tests');
    const items = await testCollection.repository.find();
    expect(items.length).toBe(1);
  });

  it('should dump and restore uuid field', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'tests',
        fields: [
          {
            type: 'uuid',
            name: 'uuid_test',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('tests').create({
      values: {},
    });

    const dumper = new Dumper(app);

    const result = await dumper.dump({
      groups: new Set(['required', 'custom']),
    });

    const restorer = new Restorer(app, {
      backUpFilePath: result.filePath,
    });

    await restorer.restore({
      groups: new Set(['required', 'custom']),
    });

    const testCollection = app.db.getCollection('tests');
    const items = await testCollection.repository.find();
    expect(items.length).toBe(1);
  });

  describe('id seq', () => {
    let allGroups;

    beforeEach(async () => {
      await db.getRepository('collections').create({
        values: {
          name: 'tests',
          fields: [
            {
              type: 'string',
              name: 'name',
            },
          ],
        },
        context: {},
      });

      const Test = db.getCollection('tests');

      for (let i = 0; i < 10; i++) {
        await Test.repository.create({
          values: {
            name: `test${i}`,
          },
        });
      }

      const dumper = new Dumper(app);

      const collections = await dumper.collectionsGroupByDataTypes();
      allGroups = Object.keys(collections);

      const result = await dumper.dump({
        groups: new Set(allGroups),
      });

      const restorer = new Restorer(app, {
        backUpFilePath: result.filePath,
      });

      await restorer.restore({
        groups: new Set(allGroups),
      });
    });

    it('should reset id seq after restore collection', async () => {
      const testCollection = app.db.getCollection('tests');

      await testCollection.repository.create({
        values: {
          name: 'test',
        },
      });
    });
  });

  it('should restore parent collection', async () => {
    if (!db.inDialect('postgres')) {
      return;
    }

    await db.getRepository('collections').create({
      values: {
        name: 'parent',
        fields: [
          {
            type: 'string',
            name: 'parentName',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('collections').create({
      values: {
        name: 'child',
        inherits: ['parent'],
        fields: [
          {
            type: 'string',
            name: 'childName',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('parent').create({
      values: {
        parentName: 'parentName',
      },
    });

    await db.getRepository('child').create({
      values: {
        childName: 'childName',
      },
    });

    expect(await app.db.getRepository('parent').count()).toEqual(2);

    const dumper = new Dumper(app);
    const result = await dumper.dump({
      groups: new Set(['required', 'custom']),
    });

    const restorer = new Restorer(app, {
      backUpFilePath: result.filePath,
    });

    await restorer.restore({
      groups: new Set(['required', 'custom']),
    });

    expect(await app.db.getRepository('parent').count()).toEqual(2);
  });

  it.skip('should restore with audit logs', async () => {
    await app.runCommand('pm', 'enable', 'audit-logs');

    await app.db.getRepository('collections').create({
      values: {
        name: 'tests',
        logging: true,
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      },
      context: {},
    });

    const Post = app.db.getCollection('tests').model;
    const post = await Post.create({ name: '123456' });
    await post.update({ name: '223456' });
    await post.destroy();
    const auditLogs = await app.db.getCollection('auditLogs').repository.find({
      appends: ['changes'],
    });

    expect(auditLogs.length).toBe(3);

    const dumper = new Dumper(app);
    const result = await dumper.dump({
      groups: new Set(['required', 'log']),
    });

    const restorer = new Restorer(app, {
      backUpFilePath: result.filePath,
    });

    await restorer.restore({
      groups: new Set(['required', 'log']),
    });

    const log = await app.db.getCollection('auditLogs').repository.findOne({
      filter: { type: 'update' },
      appends: ['changes'],
    });

    const changes = log.get('changes');
    expect(typeof changes[0].before).toBe('string');
  });

  it('should sort collections by inherits', async () => {
    const collections = [
      {
        name: 'parent1',
        inherits: [],
      },
      {
        name: 'parent2',
        inherits: [],
      },
      {
        name: 'child3',
        inherits: ['child1', 'child2'],
      },
      {
        name: 'child1',
        inherits: ['parent1', 'parent2'],
      },
      {
        name: 'child2',
        inherits: ['parent1'],
      },
    ];

    const sorted = Restorer.sortCollectionsByInherits(collections);

    expect(sorted[0].name).toBe('parent1');
    expect(sorted[1].name).toBe('parent2');
    expect(sorted[2].name).toBe('child1');
    expect(sorted[3].name).toBe('child2');
    expect(sorted[4].name).toBe('child3');
  });

  it('should handle inherited collection order', async () => {
    if (!db.inDialect('postgres')) {
      return;
    }

    await db.getRepository('collections').create({
      values: {
        name: 'parent1',
        fields: [
          {
            type: 'string',
            name: 'parent1Name',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('collections').create({
      values: {
        name: 'parent2',
        fields: [
          {
            type: 'string',
            name: 'parent2Name',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('collections').create({
      values: {
        name: 'child1',
        inherits: ['parent1', 'parent2'],
        fields: [
          {
            type: 'string',
            name: 'child1Name',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('parent1').create({
      values: {
        parent1Name: 'parent1Name',
      },
    });

    await db.getRepository('parent2').create({
      values: {
        parent2Name: 'parent2Name',
      },
    });

    await db.getRepository('child1').create({
      values: {
        child1Name: 'child1Name',
      },
    });

    const dumper = new Dumper(app);
    const result = await dumper.dump({
      groups: new Set(['required', 'custom']),
    });

    const restorer = new Restorer(app, {
      backUpFilePath: result.filePath,
    });

    const meta = await restorer.parseBackupFile();

    const businessCollections = meta.dumpableCollectionsGroupByGroup.custom;
    const child1 = businessCollections.find(({ name }) => name === 'child1');

    expect(child1.inherits).toEqual(['parent1', 'parent2']);

    await restorer.restore({
      groups: new Set(['required', 'custom']),
    });
  });

  it.skip('should list dumped files', async () => {
    const dumper = new Dumper(app);
    const list = await dumper.allBackUpFilePaths({
      includeInProgress: true,
      dir: path.join(__dirname, './fixtures/files'),
    });
    console.log({ list });
    expect(list.length).toBe(2);
  });

  it('should dump and restore with sql collection', async () => {
    const userCollection = db.getCollection('users');

    await db.getRepository('collections').create({
      values: {
        name: 'tests',
        sql: `select count(*) as count
              from ${userCollection.getTableNameWithSchemaAsString()}`,
        fields: [
          {
            type: 'integer',
            name: 'count',
          },
        ],
      },
      context: {},
    });

    const usersCount = await db.getRepository('users').count();
    const res = await db.getRepository('tests').findOne();
    assert.equal(res.get('count'), usersCount);

    const dumper = new Dumper(app);
    const result = await dumper.dump({
      groups: new Set(['required', 'custom']),
    });

    const restorer = new Restorer(app, {
      backUpFilePath: result.filePath,
    });

    await restorer.restore({
      groups: new Set(['required', 'custom']),
    });

    const res2 = await app.db.getRepository('tests').findOne();
    assert.equal(res2.get('count'), usersCount);
  });

  it('should dump with view that not exists', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'view_not_exists',
        view: true,
        schema: db.inDialect('postgres') ? 'public' : undefined,
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      },
      context: {},
    });

    const dumper = new Dumper(app);
    const result = await dumper.dump({
      groups: new Set(['required', 'custom']),
    });

    const restorer = new Restorer(app, {
      backUpFilePath: result.filePath,
    });

    await restorer.restore({
      groups: new Set(['required', 'custom']),
    });
  });

  it('should dump and restore with view collection', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'tests',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      },
      context: {},
    });

    const testCollection = db.getCollection('tests');

    const viewName = 'test_view';

    const dropViewSQL = `DROP VIEW IF EXISTS ${viewName}`;
    await db.sequelize.query(dropViewSQL);

    const viewSQL = `CREATE VIEW ${viewName} as SELECT * FROM ${testCollection.quotedTableName()}`;

    await db.sequelize.query(viewSQL);

    await db.getRepository('collections').create({
      values: {
        name: viewName,
        view: true,
        schema: db.inDialect('postgres') ? 'public' : undefined,
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      },
      context: {},
    });

    const dumper = new Dumper(app);
    const result = await dumper.dump({
      groups: new Set(['required', 'custom']),
    });

    const restorer = new Restorer(app, {
      backUpFilePath: result.filePath,
    });

    await restorer.restore({
      groups: new Set(['required', 'custom']),
    });
  });

  it('should dump & restore sequence data', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'tests',
        fields: [
          {
            type: 'sequence',
            name: 'name',
            patterns: [
              {
                type: 'integer',
                options: { key: 1 },
              },
            ],
          },
        ],
      },
      context: {},
    });

    const Test = db.getCollection('tests');

    const sequenceCollection = db.getCollection('sequences');
    expect(await sequenceCollection.repository.count()).toBe(1);

    const dumper = new Dumper(app);
    const result = await dumper.dump({
      groups: new Set(['required', 'custom']),
    });

    const restorer = new Restorer(app, {
      backUpFilePath: result.filePath,
    });

    await restorer.restore({
      groups: new Set(['required', 'custom']),
    });

    expect(await app.db.getCollection('sequences').repository.count()).toBe(1);
  });

  it('should dump and restore map file', async () => {
    const data = {
      polygon: [
        [114.081074, 22.563646],
        [114.147335, 22.559207],
        [114.134975, 22.531621],
        [114.09103, 22.520045],
        [114.033695, 22.575376],
        [114.025284, 22.55461],
        [114.033523, 22.533048],
      ],
      point: [114.048868, 22.554927],
      circle: [114.058996, 22.549695, 4171],
      lineString: [
        [114.047323, 22.534158],
        [114.120966, 22.544146],
      ],
    };

    await app.runAsCLI(['pm', 'enable', 'map'], { from: 'user' });

    const fields = [
      {
        type: 'point',
        name: 'point',
      },
      {
        type: 'polygon',
        name: 'polygon',
      },
      {
        type: 'circle',
        name: 'circle',
      },
      {
        type: 'lineString',
        name: 'lineString',
      },
    ];

    await app.db.getRepository('collections').create({
      values: {
        name: 'tests',
        fields,
      },
      context: {},
    });

    await app.db.getRepository('tests').create({
      values: {
        ...data,
      },
    });

    const dumper = new Dumper(app);
    const result = await dumper.dump({
      groups: new Set(['required', 'custom']),
    });

    const restorer = new Restorer(app, {
      backUpFilePath: result.filePath,
    });

    await restorer.restore({
      groups: new Set(['required', 'custom']),
    });

    const testCollection = app.db.getCollection('tests');
    const tableInfo = await app.db.sequelize.getQueryInterface().describeTable(testCollection.getTableNameWithSchema());

    expect(tableInfo.point).toBeDefined();
  });

  it('should dump collection meta', async () => {
    await db.getRepository('collections').create({
      values: {
        name: 'tests',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      },
      context: {},
    });

    await db.getRepository('tests').create({
      values: [
        {
          name: 'test1',
        },
        {
          name: 'test2',
        },
      ],
    });

    const dumper = new Dumper(app);
    await dumper.dumpCollection({
      name: 'tests',
    });

    const collectionDir = path.resolve(dumper.workDir, 'collections', 'tests');
    const metaFile = path.resolve(collectionDir, 'meta');
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));

    expect(meta.name).toBe('tests');
    const autoIncrement = meta.autoIncrement;
    expect(autoIncrement).toBeDefined();
  });

  it('should save dump meta to dump file', async () => {
    const dumper = new Dumper(app);
    const result = await dumper.dump({
      groups: new Set(['required']),
    });

    const restorer = new Restorer(app, {
      backUpFilePath: result.filePath,
    });

    const meta = await restorer.parseBackupFile();
    expect(meta.dumpableCollectionsGroupByGroup.required).toBeTruthy();

    expect(meta.DB_UNDERSCORED).toBeDefined();
  });

  describe('get file status', function () {
    it('should get in progress status', async () => {
      const fileName = 'backup_20231111_112233.nbdump';
      const fullPath = path.resolve(__dirname, './fixtures', fileName);

      const status = await Dumper.getFileStatus(fullPath);
      expect(status['inProgress']).toBeTruthy();
    });

    it('should get ok status', async () => {
      const dumper = new Dumper(app);
      const result = await dumper.dump({
        groups: new Set(['required']),
      });

      const status = await Dumper.getFileStatus(result.filePath);
      expect(status['inProgress']).toBeFalsy();
    });

    it('should throw error when file not exists', async () => {
      await expect(Dumper.getFileStatus('not_exists_file')).rejects.toThrowError();
    });
  });

  it('should run dump task', async () => {
    const dumper = new Dumper(app);

    const taskId = await dumper.runDumpTask({
      groups: new Set(['meta']),
    });

    expect(taskId).toBeDefined();

    const promise = Dumper.getTaskPromise(taskId);
    expect(promise).toBeDefined();

    await promise;
  });

  it('should create dump file name', async () => {
    expect(Dumper.generateFileName()).toMatch(/^backup_\d{8}_\d{6}_\d{4}\.nbdump$/);
  });

  it('should get dumped collections by data types', async () => {
    await app.db.getRepository('collections').create({
      values: {
        name: 'test_collection',
        fields: [
          {
            name: 'test_field1',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    const dumper = new Dumper(app);
    const collections = await dumper.getCollectionsByDataTypes(new Set(['custom']));
    expect(collections.includes('test_collection')).toBeTruthy();
  });

  it('should dump collection table structure', async () => {
    await app.db.getRepository('collections').create({
      values: {
        name: 'test_collection',
        fields: [
          {
            name: 'test_field1',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    const dumper = new Dumper(app);
    await dumper.dumpCollection({
      name: 'test_collection',
    });

    const collectionDir = path.resolve(dumper.workDir, 'collections', 'test_collection');
    const metaFile = path.resolve(collectionDir, 'meta');
    const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));

    const attributes = meta.attributes;
    expect(attributes).toBeDefined();
    expect(attributes.id.isCollectionField).toBeFalsy();
    expect(attributes.id.type).toBe('BIGINT');

    expect(attributes['test_field1'].isCollectionField).toBeTruthy();
    expect(attributes['test_field1'].type).toBe('string');
  });

  it('should get dumped collections with origin option', async () => {
    const dumper = new Dumper(app);
    const dumpableCollections = await dumper.dumpableCollections();
    const applicationPlugins = dumpableCollections.find(({ name }) => name === 'applicationPlugins');

    expect(applicationPlugins.origin).toBe('@nocobase/server');
  });

  it('should get custom collections group', async () => {
    await app.db.getRepository('collections').create({
      values: {
        name: 'test_collection',
        fields: [
          {
            name: 'test_field1',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    const dumper = new Dumper(app);
    const dumpableCollections = await dumper.collectionsGroupByDataTypes();

    expect(dumpableCollections.custom).toBeDefined();
  });

  it('should dump and restore with table named by camel case', async () => {
    await app.db.getRepository('collections').create({
      values: {
        name: 'Resumes-Table',
        fields: [
          {
            name: 'stringField',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await app.db.getRepository('Resumes-Table').create({
      values: [
        {
          stringField: 'test',
        },
        {
          stringField: 'test2',
        },
      ],
    });
    await app.db.getRepository('collections').create({
      values: {
        name: 'Photos',
        fields: [
          {
            name: 'stringField',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await app.db.getRepository('Photos').create({
      values: [
        {
          stringField: 'test',
        },
        {
          stringField: 'test2',
        },
      ],
    });

    const dumper = new Dumper(app);
    const result = await dumper.dump({
      groups: new Set(['required', 'custom']),
    });

    const restorer = new Restorer(app, {
      backUpFilePath: result.filePath,
    });

    await restorer.restore({
      groups: new Set(['required', 'custom']),
    });
  });
});
