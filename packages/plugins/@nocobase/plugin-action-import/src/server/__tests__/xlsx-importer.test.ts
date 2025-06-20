/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { TemplateCreator } from '../services/template-creator';
import { XlsxImporter } from '../services/xlsx-importer';
import XLSX from 'xlsx';
import * as process from 'node:process';
import moment from 'moment';
import { PasswordField } from '@nocobase/database';

describe('xlsx importer', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['field-china-region', 'field-sequence'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('validate empty data', () => {
    let User;

    beforeEach(async () => {
      User = app.db.collection({
        name: 'users',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      });
      await app.db.sync();
    });

    it('should throw error when file only has header row', async () => {
      const templateCreator = new TemplateCreator({
        collection: User,
        columns: [
          {
            dataIndex: ['name'],
            defaultTitle: 'Name',
          },
        ],
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
      // template already has header row, no need to add data

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns: [
          {
            dataIndex: ['name'],
            defaultTitle: 'Name',
          },
        ],
        workbook: template,
      });

      await expect(importer.validate()).rejects.toThrow('No data to import');
    });

    it('should pass validation when file has header and data rows', async () => {
      const templateCreator = new TemplateCreator({
        collection: User,
        columns: [
          {
            dataIndex: ['name'],
            defaultTitle: 'Name',
          },
        ],
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['Test Data 1'], ['Test Data 2']], {
        origin: 'A2',
      });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns: [
          {
            dataIndex: ['name'],
            defaultTitle: 'Name',
          },
        ],
        workbook: template,
      });

      let error;

      try {
        await importer.validate();
      } catch (e) {
        error = e;
      }

      expect(error).toBeUndefined();
    });
  });

  describe('import with date field', () => {
    let User;

    beforeEach(async () => {
      User = app.db.collection({
        name: 'users',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'datetime',
            name: 'datetime',
            interface: 'datetime',
          },
          {
            type: 'datetimeNoTz',
            name: 'datetimeNoTz',
            interface: 'datetimeNoTz',
            uiSchema: {
              'x-component-props': {
                picker: 'date',
                dateFormat: 'YYYY-MM-DD',
                showTime: true,
                timeFormat: 'HH:mm:ss',
              },
            },
          },
          {
            type: 'dateOnly',
            name: 'dateOnly',
            interface: 'date',
          },
          {
            type: 'unixTimestamp',
            name: 'unixTimestamp',
            interface: 'unixTimestamp',
            uiSchema: {
              'x-component-props': {
                picker: 'date',
                dateFormat: 'YYYY-MM-DD',
                showTime: true,
                timeFormat: 'HH:mm:ss',
              },
            },
          },
        ],
      });

      await app.db.sync();
    });

    it('should import with dateOnly', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['dateOnly'],
          defaultTitle: '日期',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: User,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          ['test', 77383],
          ['test2', '2021-10-18'],
          ['test3', 20241112],
        ],
        { origin: 'A2' },
      );

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns,
        workbook: template,
      });

      await importer.run();

      const users = (await User.repository.find()).map((user) => user.toJSON());
      expect(users[0]['dateOnly']).toBe('2111-11-12');
      expect(users[1]['dateOnly']).toBe('2021-10-18');
      expect(users[2]['dateOnly']).toBe('2024-11-12');
    });

    it.skipIf(process.env['DB_DIALECT'] === 'sqlite')('should import with datetimeNoTz', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['datetimeNoTz'],
          defaultTitle: '日期',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: User,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          ['test', 77383],
          ['test2', '2021-10-18 12:31:20'],
          ['test3', 41557.4377314815],
        ],
        { origin: 'A2' },
      );

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns,
        workbook: template,
      });

      await importer.run();

      const users = (await User.repository.find()).map((user) => user.toJSON());
      expect(users[0]['datetimeNoTz']).toBe('2111-11-12 00:00:00');
      expect(users[1]['datetimeNoTz']).toBe('2021-10-18 12:31:20');
      expect(users[2]['datetimeNoTz']).toBe('2013-10-10 10:30:20');
    });

    it('should import with unixTimestamp', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['unixTimestamp'],
          defaultTitle: '日期',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: User,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          ['test', 77383],
          ['test2', 20241112],
          ['test3', '2024-11-12'],
        ],
        { origin: 'A2' },
      );

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns,
        workbook: template,
      });

      await importer.run();

      const users = (await User.repository.find()).map((user) => user.toJSON());
      expect(moment(users[0]['unixTimestamp']).toISOString()).toEqual('2111-11-12T00:00:00.000Z');
      expect(moment(users[1]['unixTimestamp'])).toBeDefined();
      expect(moment(users[2]['unixTimestamp'])).toBeDefined();
    });

    it('should import with datetimeTz', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['datetime'],
          defaultTitle: '日期',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: User,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test', 77383]], { origin: 'A2' });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns,
        workbook: template,
      });

      await importer.run();

      const users = (await User.repository.find()).map((user) => user.toJSON());
      expect(moment(users[0]['datetime']).toISOString()).toEqual('2111-11-12T00:00:00.000Z');
    });
  });

  describe('import with select fields', () => {
    let User;
    beforeEach(async () => {
      User = app.db.collection({
        name: 'users',
        fields: [
          { type: 'string', name: 'name', title: '姓名' },
          {
            uiSchema: {
              enum: [
                {
                  value: '123',
                  label: 'Label123',
                  color: 'orange',
                },
                {
                  value: '223',
                  label: 'Label223',
                  color: 'lime',
                },
              ],
              type: 'array',
              'x-component': 'Select',
              'x-component-props': {
                mode: 'multiple',
              },
              title: 'multi-select',
            },
            defaultValue: [],
            name: 'multiSelect',
            type: 'array',
            interface: 'multipleSelect',
          },
          {
            uiSchema: {
              enum: [
                {
                  value: '123',
                  label: 'Label123',
                  color: 'orange',
                },
                {
                  value: '223',
                  label: 'Label223',
                  color: 'lime',
                },
              ],
              type: 'string',
              'x-component': 'Select',
              title: 'select',
            },
            name: 'select',
            type: 'string',
            interface: 'select',
          },
        ],
      });

      await app.db.sync();
    });

    it('should import select field with label and value', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['multiSelect'],
          defaultTitle: '多选',
        },
        {
          dataIndex: ['select'],
          defaultTitle: '单选',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: User,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test', 'Label123,223', 'Label123']], {
        origin: 'A2',
      });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns,
        workbook: template,
      });

      await importer.run();

      expect(await User.repository.count()).toBe(1);

      const user = await User.repository.findOne();

      expect(user.get('multiSelect')).toEqual(['123', '223']);
      expect(user.get('select')).toBe('123');
    });

    it('should validate values in multiple select field', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['multiSelect'],
          defaultTitle: '多选',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: User,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test', 'abc']], {
        origin: 'A2',
      });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns,
        workbook: template,
      });

      let error;

      try {
        await importer.run();
      } catch (e) {
        error = e;
      }

      expect(error).toBeTruthy();
    });
    it('should validate values in select field', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['select'],
          defaultTitle: '单选',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: User,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test', 'abc']], {
        origin: 'A2',
      });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns,
        workbook: template,
      });

      let error;

      try {
        await importer.run();
      } catch (e) {
        error = e;
      }

      expect(error).toBeTruthy();
    });
  });

  describe('import with belongs to association', async () => {
    let Profile;
    let User;

    beforeEach(async () => {
      Profile = app.db.collection({
        name: 'profiles',
        autoGenId: false,
        fields: [
          {
            type: 'bigInt',
            name: 'id',
            primaryKey: true,
            autoIncrement: true,
          },
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'string',
            name: 'userName',
          },
          {
            type: 'belongsTo',
            name: 'user',
            target: 'users',
            foreignKey: 'userName',
            targetKey: 'name',
          },
        ],
      });

      User = app.db.collection({
        name: 'users',
        autoGenId: false,
        fields: [
          {
            type: 'bigInt',
            name: 'id',
            primaryKey: true,
            autoIncrement: true,
          },
          {
            type: 'string',
            name: 'name',
            unique: true,
          },
        ],
      });

      await app.db.sync();

      const user = await User.repository.create({
        values: {
          name: 'User1',
        },
      });
    });

    it('should import with foreignKey', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '名称',
        },
        {
          dataIndex: ['userName'],
          defaultTitle: '用户名',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: Profile,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test', 'User1']], {
        origin: 'A2',
      });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: Profile,
        columns,
        workbook: template,
      });

      await importer.run();

      const profile = await Profile.repository.findOne({
        appends: ['user'],
      });

      expect(profile.get('user').get('name')).toBe('User1');
      expect(profile.get('name')).toBe('test');
    });

    it('should import with association field', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '名称',
        },
        {
          dataIndex: ['user', 'name'],
          defaultTitle: '用户名',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: Profile,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test', 'User1']], {
        origin: 'A2',
      });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: Profile,
        columns,
        workbook: template,
      });

      await importer.run();

      const profile = await Profile.repository.findOne({
        appends: ['user'],
      });

      expect(profile.get('user').get('name')).toBe('User1');
      expect(profile.get('name')).toBe('test');
    });
  });

  describe('import with associations', () => {
    let User;
    let Post;
    let Tag;

    beforeEach(async () => {
      User = app.db.collection({
        name: 'users',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'hasMany',
            name: 'posts',
            target: 'posts',
            interface: 'o2m',
            foreignKey: 'userId',
          },
        ],
      });

      Post = app.db.collection({
        name: 'posts',
        fields: [
          {
            type: 'string',
            name: 'title',
          },
          {
            type: 'belongsTo',
            name: 'user',
            target: 'users',
            interface: 'm2o',
          },
          {
            type: 'belongsToMany',
            name: 'tags',
            target: 'tags',
            interface: 'm2m',
            through: 'postsTags',
          },
        ],
      });

      Tag = app.db.collection({
        name: 'tags',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'belongsToMany',
            name: 'posts',
            target: 'posts',
            interface: 'm2m',
            through: 'postsTags',
          },
        ],
      });

      await app.db.sync();
    });

    it('should import many to many with id', async () => {
      await Tag.repository.create({
        values: [
          {
            title: 't1',
          },
          {
            title: 't2',
          },
        ],
      });

      const columns = [
        {
          dataIndex: ['title'],
          defaultTitle: '名称',
        },
        {
          dataIndex: ['tags', 'id'],
          defaultTitle: 'IDS',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: Post,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(
        worksheet,
        [
          ['test', '1,2'],
          ['test2', 1],
        ],
        {
          origin: 'A2',
        },
      );

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: Post,
        columns,
        workbook: template,
      });

      await importer.run();

      const posts = await Post.repository.find({
        appends: ['tags'],
      });

      expect(posts.length).toBe(2);

      expect(posts[0]['tags'].map((item: any) => item.id)).toEqual([1, 2]);
      expect(posts[1]['tags'].map((item: any) => item.id)).toEqual([1]);
    });

    it('should validate to many association', async () => {
      const columns = [
        {
          dataIndex: ['name'],
          defaultTitle: '名称',
        },
        {
          dataIndex: ['posts', 'title'],
          defaultTitle: '标题',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: User,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test', '测试标题']], {
        origin: 'A2',
      });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: User,
        columns,
        workbook: template,
      });

      let error;

      try {
        await importer.run();
      } catch (e) {
        error = e;
      }

      expect(error).toBeTruthy();
    });

    it('should validate to one association', async () => {
      const columns = [
        {
          dataIndex: ['title'],
          defaultTitle: '标题',
        },
        {
          dataIndex: ['user', 'name'],
          defaultTitle: '用户名',
        },
      ];

      const templateCreator = new TemplateCreator({
        collection: Post,
        columns,
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

      const worksheet = template.Sheets[template.SheetNames[0]];

      XLSX.utils.sheet_add_aoa(worksheet, [['test title', 'test user']], {
        origin: 'A2',
      });

      const importer = new XlsxImporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: Post,
        columns,
        workbook: template,
      });

      let error;

      try {
        await importer.run();
      } catch (e) {
        error = e;
      }

      expect(error).toBeTruthy();
    });
  });

  it('should report validation error message on not null validation', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
          allowNull: false,
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    await app.db.sync();

    const templateCreator = new TemplateCreator({
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(worksheet, [[null, 'test@qq.com']], {
      origin: 'A2',
    });

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
      workbook: template,
    });

    let error;

    try {
      await importer.run();
    } catch (e) {
      error = e;
    }

    expect(error).toBeTruthy();
  });

  it('should report validation error message on unique validation', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
          unique: true,
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    await app.db.sync();

    const templateCreator = new TemplateCreator({
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];
    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ['User1', 'test@test.com'],
        ['User1', 'test@test.com'],
      ],
      {
        origin: 'A2',
      },
    );

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
      workbook: template,
    });

    let error;

    try {
      await importer.run();
    } catch (e) {
      error = e;
    }

    expect(error).toBeTruthy();
  });

  it('should import china region field', async () => {
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'belongsToMany',
          target: 'chinaRegions',
          through: 'userRegions',
          targetKey: 'code',
          interface: 'chinaRegion',
          name: 'region',
        },
      ],
    });

    await app.db.sync();

    const columns = [
      { dataIndex: ['title'], defaultTitle: 'Title' },
      {
        dataIndex: ['region'],
        defaultTitle: 'region',
      },
    ];

    const templateCreator = new TemplateCreator({
      collection: Post,
      columns,
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ['post0', '山西省/长治市/潞城区'],
        ['post1', ''],
        ['post2', null],
      ],
      {
        origin: 'A2',
      },
    );

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      columns,
      workbook: template,
    });

    await importer.run();

    expect(await Post.repository.count()).toBe(3);

    const post = await Post.repository.findOne({
      appends: ['region'],
    });

    expect(post.get('region').map((item: any) => item.code)).toEqual(['14', '1404', '140406']);
  });

  it.skipIf(process.env['DB_DIALECT'] === 'sqlite')('should import with number field', async () => {
    const User = app.db.collection({
      name: 'users',
      autoGenId: false,
      fields: [
        {
          type: 'bigInt',
          name: 'id',
          primaryKey: true,
          autoIncrement: true,
        },
        {
          type: 'bigInt',
          interface: 'integer',
          name: 'bigInt',
        },
        {
          type: 'float',
          interface: 'percent',
          name: 'percent',
        },
        {
          type: 'float',
          interface: 'float',
          name: 'float',
        },
        {
          type: 'boolean',
          interface: 'boolean',
          name: 'boolean',
        },
      ],
    });

    await app.db.sync();

    const columns = [
      {
        dataIndex: ['id'],
        defaultTitle: 'ID',
      },
      {
        dataIndex: ['bigInt'],
        defaultTitle: 'bigInt',
      },
      {
        dataIndex: ['percent'],
        defaultTitle: '百分比',
      },
      {
        dataIndex: ['float'],
        defaultTitle: '浮点数',
      },
      {
        dataIndex: ['boolean'],
        defaultTitle: '布尔值',
      },
    ];

    const templateCreator = new TemplateCreator({
      collection: User,
      columns,
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [1, '1238217389217389217', '10%', 0.1, '是'],
        [2, 123123, '20%', 0.2, '0'],
      ],
      {
        origin: 'A2',
      },
    );

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns,
      workbook: template,
    });

    await importer.run();

    expect(await User.repository.count()).toBe(2);

    const user1 = await User.repository.findOne({
      filter: {
        id: 1,
      },
    });

    const user1Json = user1.toJSON();

    expect(user1Json['bigInt']).toBe('1238217389217389217');
    expect(user1Json['percent']).toBe(0.1);
    expect(user1Json['float']).toBe(0.1);
    expect(user1Json['boolean']).toBe(true);

    const user2 = await User.repository.findOne({
      filter: {
        id: 2,
      },
    });

    const user2Json = user2.toJSON();
    expect(user2Json['bigInt']).toBe(123123);
    expect(user2Json['percent']).toBe(0.2);
    expect(user2Json['float']).toBe(0.2);
    expect(user2Json['boolean']).toBe(false);
  });

  it('should not reset id seq if not import id field', async () => {
    const User = app.db.collection({
      name: 'users',
      autoGenId: false,
      fields: [
        {
          type: 'bigInt',
          name: 'id',
          primaryKey: true,
          autoIncrement: true,
        },
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    await app.db.sync();

    const templateCreator = new TemplateCreator({
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ['User1', 'test@test.com'],
        ['User2', 'test2@test.com'],
      ],
      {
        origin: 'A2',
      },
    );

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
      workbook: template,
    });

    const testFn = vi.fn();
    importer.on('seqReset', testFn);

    await importer.run();

    expect(await User.repository.count()).toBe(2);

    const user3 = await User.repository.create({
      values: {
        name: 'User3',
        email: 'test3@test.com',
      },
    });

    expect(user3.get('id')).toBe(3);
    expect(testFn).not.toBeCalled();
  });

  it('should reset id seq after import id field', async () => {
    const User = app.db.collection({
      name: 'users',
      autoGenId: false,
      fields: [
        {
          type: 'bigInt',
          name: 'id',
          primaryKey: true,
          autoIncrement: true,
        },
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'email',
        },
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
    });

    await app.db.sync();

    const templateCreator = new TemplateCreator({
      collection: User,
      columns: [
        {
          dataIndex: ['id'],
          defaultTitle: 'ID',
        },
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        [1, 'User1', 'test@test.com'],
        [2, 'User2', 'test2@test.com'],
      ],
      {
        origin: 'A2',
      },
    );

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['id'],
          defaultTitle: 'ID',
        },
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
      workbook: template,
    });

    const testFn = vi.fn();
    importer.on('seqReset', testFn);

    await importer.run();

    expect(await User.repository.count()).toBe(2);

    const user3 = await User.repository.create({
      values: {
        name: 'User3',
        email: 'test3@test.com',
      },
    });

    expect(user3.get('id')).toBe(3);

    expect(testFn).toBeCalled();
  });

  it('should validate workbook with error', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.sheet_new();

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ['column1', 'column2'],
        ['row21', 'row22'],
      ],
      {
        origin: 'A1',
      },
    );

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet 1');

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
      workbook,
    });

    let error;
    try {
      await importer.validate();
    } catch (e) {
      error = e;
    }

    expect(error).toBeTruthy();
  });

  it('should validate workbook true', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    const templateCreator = new TemplateCreator({
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
      workbook: template,
    });

    // insert a row for test
    const worksheet = template.Sheets[template.SheetNames[0]];
    XLSX.utils.sheet_add_aoa(worksheet, [['User1', 'test@test.com']], {
      origin: 'A2',
    });

    let error;
    try {
      await importer.getData();
    } catch (e) {
      error = e;
    }

    expect(error).toBeFalsy();
  });

  it('should import with associations', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    const Tag = app.db.collection({
      name: 'tags',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    const Comments = app.db.collection({
      name: 'comments',
      fields: [
        {
          type: 'string',
          name: 'content',
        },
      ],
    });

    const Post = app.db.collection({
      name: 'posts',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'string',
          name: 'content',
        },
        {
          type: 'belongsTo',
          name: 'user',
          interface: 'm2o',
        },
        {
          type: 'belongsToMany',
          name: 'tags',
          through: 'postsTags',
          interface: 'm2m',
        },
        {
          type: 'hasMany',
          name: 'comments',
          interface: 'o2m',
        },
      ],
    });

    await app.db.sync();

    await User.repository.create({
      values: {
        name: 'User1',
        email: 'u1@test.com',
      },
    });

    await Tag.repository.create({
      values: [
        {
          name: 'Tag1',
        },
        {
          name: 'Tag2',
        },
        {
          name: 'Tag3',
        },
      ],
    });

    await Comments.repository.create({
      values: [
        {
          content: 'Comment1',
        },
        {
          content: 'Comment2',
        },
        {
          content: 'Comment3',
        },
      ],
    });

    const importColumns = [
      {
        dataIndex: ['title'],
        defaultTitle: '标题',
      },
      {
        dataIndex: ['content'],
        defaultTitle: '内容',
      },
      {
        dataIndex: ['user', 'name'],
        defaultTitle: '作者',
      },
      {
        dataIndex: ['tags', 'name'],
        defaultTitle: '标签',
      },
      {
        dataIndex: ['comments', 'content'],
        defaultTitle: '评论',
      },
    ];

    const templateCreator = new TemplateCreator({
      collection: Post,
      columns: importColumns,
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ['Post1', 'Content1', 'User1', 'Tag1,Tag2', 'Comment1,Comment2'],
        ['Post2', 'Content2', 'User1', 'Tag2,Tag3', 'Comment3'],
        ['Post3', 'Content3', 'User1', 'Tag3', ''],
        ['Post4', '', '', ''],
        ['Post5', null, null, null],
      ],
      {
        origin: 'A2',
      },
    );

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      columns: importColumns,
      workbook: template,
    });

    await importer.run();

    expect(await Post.repository.count()).toBe(5);
  });

  it('should import data with xlsx', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    await app.db.sync();

    const templateCreator = new TemplateCreator({
      collection: User,
      explain: 'test',
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ['User1', 'test@test.com'],
        ['User2', 'test2@test.com'],
      ],
      {
        origin: 'A3',
      },
    );

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      explain: 'test',
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
      workbook: template,
    });

    await importer.run();

    expect(await User.repository.count()).toBe(2);
  });

  it('should throw error when import failed', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
          unique: true,
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    await app.db.sync();

    const templateCreator = new TemplateCreator({
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ['User1', 'test@test.com'],
        ['User1', 'test2@test.com'],
      ],
      {
        origin: 'A2',
      },
    );

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
      workbook: template,
    });

    let error;
    try {
      await importer.run();
    } catch (e) {
      error = e;
    }

    expect(await User.repository.count()).toBe(0);
    expect(error).toBeTruthy();
  });

  it('should import data with multiline explain and field descriptions', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    await app.db.sync();

    const templateCreator = new TemplateCreator({
      collection: User,
      explain: '这是第一行说明\n这是第二行说明',
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
          description: '请输入用户姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
          description: '请输入有效的邮箱地址',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const headerRowIndex = templateCreator.getHeaderRowIndex();

    console.log({ headerRowIndex });
    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(
      worksheet,
      [
        ['User1', 'test@test.com'],
        ['User2', 'test2@test.com'],
      ],
      {
        origin: `A${headerRowIndex + 1}`,
      },
    );

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
          description: '请输入用户姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
          description: '请输入有效的邮箱地址',
        },
      ],
      workbook: template,
    });

    await importer.run();

    expect(await User.repository.count()).toBe(2);

    const users = await User.repository.find();
    expect(users[0].get('name')).toBe('User1');
    expect(users[0].get('email')).toBe('test@test.com');
    expect(users[1].get('name')).toBe('User2');
    expect(users[1].get('email')).toBe('test2@test.com');
  });

  describe('template creator', () => {
    it('should create template with explain and field descriptions', async () => {
      const User = app.db.collection({
        name: 'users',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
          {
            type: 'string',
            name: 'email',
          },
        ],
      });

      const templateCreator = new TemplateCreator({
        collection: User,
        explain: '这是导入说明\n第二行说明',
        columns: [
          {
            dataIndex: ['name'],
            defaultTitle: '姓名',
            description: '请输入用户姓名',
          },
          {
            dataIndex: ['email'],
            defaultTitle: '邮箱',
            description: '请输入有效的邮箱地址',
          },
        ],
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
      const worksheet = template.Sheets[template.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      // 验证说明文本
      expect(data[0][0]).toBe('这是导入说明');
      expect(data[1][0]).toBe('第二行说明');
      // 验证空行
      expect(data[2][0]).toBe('');
      // 验证字段描述
      expect(data[3][0]).toBe('姓名：请输入用户姓名');
      expect(data[4][0]).toBe('邮箱：请输入有效的邮箱地址');
      // 验证表头
      expect(data[5]).toEqual(['姓名', '邮箱']);
    });

    it('should create template with only field descriptions', async () => {
      const User = app.db.collection({
        name: 'users',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      });

      const templateCreator = new TemplateCreator({
        collection: User,
        columns: [
          {
            dataIndex: ['name'],
            defaultTitle: '姓名',
            description: '请输入用户姓名',
          },
        ],
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
      const worksheet = template.Sheets[template.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      // 验证字段描述
      expect(data[0][0]).toBe('姓名：请输入用户姓名');
      // 验证表头
      expect(data[1]).toEqual(['姓名']);
    });

    it('should create template with only explain', async () => {
      const User = app.db.collection({
        name: 'users',
        fields: [
          {
            type: 'string',
            name: 'name',
          },
        ],
      });

      const templateCreator = new TemplateCreator({
        collection: User,
        explain: '这是导入说明',
        columns: [
          {
            dataIndex: ['name'],
            defaultTitle: '姓名',
          },
        ],
      });

      const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
      const worksheet = template.Sheets[template.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];

      // 验证说明文本
      expect(data[0][0]).toBe('这是导入说明');
      // 验证表头
      expect(data[1]).toEqual(['姓名']);
    });
  });

  it('should import data with single column', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
      ],
    });

    await app.db.sync();

    const templateCreator = new TemplateCreator({
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(worksheet, [['User1'], ['User2']], {
      origin: 'A2',
    });

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
      ],
      workbook: template,
    });

    await importer.run();

    expect(await User.repository.count()).toBe(2);
    const users = await User.repository.find();
    expect(users[0].get('name')).toBe('User1');
    expect(users[1].get('name')).toBe('User2');
  });

  it('should import with associations by target key', async () => {
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        {
          name: 'title',
          type: 'string',
        },
        {
          name: 'tags',
          type: 'belongsToMany',
          through: 'post_tag',
          targetKey: 'name',
          interface: 'm2m',
        },
      ],
    });

    const Tag = app.db.collection({
      name: 'tags',
      fields: [
        {
          name: 'name',
          type: 'string',
          unique: true,
        },
      ],
    });

    await app.db.sync();

    await Tag.repository.create({
      values: {
        name: 't1',
      },
    });

    const templateCreator = new TemplateCreator({
      collection: Post,
      columns: [
        {
          dataIndex: ['title'],
          defaultTitle: '标题',
        },
        {
          dataIndex: ['tags', 'name'],
          defaultTitle: 'TagsName',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(worksheet, [['Post1', 't1']], {
      origin: 'A2',
    });

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      columns: [
        {
          dataIndex: ['title'],
          defaultTitle: '标题',
        },
        {
          dataIndex: ['tags', 'name'],
          defaultTitle: 'TagsName',
        },
      ],
      workbook: template,
    });

    await importer.run();

    expect(await Post.repository.count()).toBe(1);
  });

  it('should filter no permission columns', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
        },
        {
          type: 'string',
          name: 'email',
        },
      ],
    });

    await app.db.sync();

    const templateCreator = new TemplateCreator({
      collection: User,
      explain: 'test',
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(worksheet, [['User1', 'test@test.com']], {
      origin: 'A3',
    });

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      explain: 'test',
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['email'],
          defaultTitle: '邮箱',
        },
      ],
      workbook: template,
    });
    await importer.run({
      context: {
        permission: {
          can: { params: { fields: ['name'] } },
        },
      },
    });

    expect(await User.repository.count()).toBe(1);
    const user = await User.repository.findOne();
    expect(user.get('name')).toBe('User1');
    expect(user.get('email')).not.exist;
  });

  it('should import time field successfully', async () => {
    const TimeCollection = app.db.collection({
      name: 'time_tests',
      fields: [
        {
          type: 'time',
          name: 'brithtime',
        },
      ],
    });

    await app.db.sync();
    const templateCreator = new TemplateCreator({
      collection: TimeCollection,
      explain: 'test',
      columns: [
        {
          dataIndex: ['birthtime'],
          defaultTitle: '出生时间',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(worksheet, [['12:12:12']], {
      origin: 'A3',
    });

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: TimeCollection,
      explain: 'test',
      columns: [
        {
          dataIndex: ['brithtime'],
          defaultTitle: '出生时间',
        },
      ],
      workbook: template,
    });

    await importer.run();
    const count = await TimeCollection.repository.count();
    expect(count).toBe(1);
  });

  it('should throw error when import textarea field, value is date', async () => {
    const TextareaCollection = app.db.collection({
      name: 'textarea_tests',
      fields: [
        {
          interface: 'textarea',
          type: 'text',
          name: 'long_text',
        },
      ],
    });

    await app.db.sync();
    const templateCreator = new TemplateCreator({
      collection: TextareaCollection,
      explain: 'test',
      columns: [
        {
          dataIndex: ['long_text'],
          defaultTitle: '多行文本',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(worksheet, [[new Date()]], {
      origin: 'A3',
    });

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: TextareaCollection,
      explain: 'test',
      columns: [
        {
          dataIndex: ['long_text'],
          defaultTitle: '多行文本',
        },
      ],
      workbook: template,
    });

    expect(importer.run()).rejects.toThrow();
  });

  it('should import password field, insert data is encrypt', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'password', name: 'password' },
      ],
    });
    await app.db.sync();
    const templateCreator = new TemplateCreator({
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['password'],
          defaultTitle: '密码',
        },
      ],
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(worksheet, [['zhangsan', '123456']], {
      origin: 'A2',
    });

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: '姓名',
        },
        {
          dataIndex: ['password'],
          defaultTitle: '密码',
        },
      ],
      workbook: template,
    });

    await importer.run();

    const pwd = User.getField<PasswordField>('password');
    const user = await User.model.findOne({ where: { name: 'zhangsan' } });
    expect(await pwd.verify('123456', user.password)).toBeTruthy();
  });
});
