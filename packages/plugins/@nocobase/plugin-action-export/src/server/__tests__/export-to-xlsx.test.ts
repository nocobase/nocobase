/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { BaseInterface } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';
import { uid } from '@nocobase/utils';
import fs from 'fs';
import moment from 'moment';
import path from 'path';
import { XlsxExporter } from '../services/xlsx-exporter';
import { Workbook } from 'exceljs';

function getXlsxData(worksheet) {
  const data = worksheet.getSheetValues()[2];
  return data.slice(1);
}

describe('export to xlsx with preset', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase', 'map', 'field-china-region'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  describe('export with date field', () => {
    let Post;

    beforeEach(async () => {
      Post = app.db.collection({
        name: 'posts',
        fields: [
          { type: 'string', name: 'title' },
          {
            name: 'datetime',
            type: 'datetime',
            interface: 'datetime',
            uiSchema: {
              'x-component-props': { picker: 'date', dateFormat: 'YYYY-MM-DD', gmt: false, showTime: false, utc: true },
              type: 'string',
              'x-component': 'DatePicker',
              title: 'dateTz',
            },
          },
          {
            name: 'dateOnly',
            type: 'dateOnly',
            interface: 'date',
            defaultToCurrentTime: false,
            onUpdateToCurrentTime: false,
            timezone: true,
          },
          {
            name: 'datetimeNoTz',
            type: 'datetimeNoTz',
            interface: 'datetimeNoTz',
            uiSchema: {
              'x-component-props': { picker: 'date', dateFormat: 'YYYY-MM-DD', gmt: false, showTime: false, utc: true },
              type: 'string',
              'x-component': 'DatePicker',
              title: 'dateTz',
            },
          },
          {
            name: 'unixTimestamp',
            type: 'unixTimestamp',
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

    it('should export with datetime field', async () => {
      await Post.repository.create({
        values: {
          title: 'p1',
          datetime: '2024-05-10T01:42:35.000Z',
          dateOnly: '2024-05-10',
          datetimeNoTz: '2024-01-01 00:00:00',
          unixTimestamp: '2024-05-10T01:42:35.000Z',
        },
      });
      const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
      const exporter = new XlsxExporter({
        collectionManager: app.mainDataSource.collectionManager,
        collection: Post,
        chunkSize: 10,
        columns: [
          { dataIndex: ['title'], defaultTitle: 'Title' },
          {
            dataIndex: ['datetime'],
            defaultTitle: 'datetime',
          },
          {
            dataIndex: ['dateOnly'],
            defaultTitle: 'dateOnly',
          },
          {
            dataIndex: ['datetimeNoTz'],
            defaultTitle: 'datetimeNoTz',
          },
          {
            dataIndex: ['unixTimestamp'],
            defaultTitle: 'unixTimestamp',
          },
        ],
        outputPath: xlsxFilePath,
      });

      await exporter.run();

      try {
        const workbook = new Workbook();
        await workbook.xlsx.readFile(xlsxFilePath);
        const worksheet = workbook.getWorksheet(1);
        const firstUser = getXlsxData(worksheet);

        expect(firstUser[1]).toEqual('2024-05-10');
        expect(firstUser[2]).toEqual('2024-05-10');
        expect(firstUser[3]).toEqual('2024-01-01');
        expect(firstUser[4]).toEqual('2024-05-10 01:42:35');
      } finally {
        exporter.cleanOutputFile();
      }
    });
  });

  it('should export with checkbox field', async () => {
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          type: 'boolean',
          name: 'test_field',
          interface: 'checkbox',
          uiSchema: {
            type: 'boolean',
            'x-component': 'Checkbox',
          },
        },
      ],
    });

    await app.db.sync();

    await Post.repository.create({
      values: {
        title: 'p1',
        test_field: true,
      },
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      chunkSize: 10,
      columns: [
        { dataIndex: ['title'], defaultTitle: 'Title' },
        {
          dataIndex: ['test_field'],
          defaultTitle: 'test_field',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const data = getXlsxData(worksheet);

      expect(data[1]).toBe('True');
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export number field with cell format', async () => {
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'integer', name: 'integer' },
        { type: 'float', name: 'float' },
        { type: 'decimal', name: 'decimal', scale: 3, precision: 12 },
      ],
    });

    await app.db.sync();

    await Post.repository.create({
      values: [
        {
          title: 'p1',
          integer: 123,
          float: 123.456,
          decimal: 234.567,
        },
        {
          title: 'p2',
          integer: 456,
          float: 456.789,
          decimal: 345.678,
        },
      ],
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      chunkSize: 10,
      columns: [
        { dataIndex: ['title'], defaultTitle: 'title' },
        {
          dataIndex: ['integer'],
          defaultTitle: 'integer',
        },
        {
          dataIndex: ['float'],
          defaultTitle: 'float',
        },
        {
          dataIndex: ['decimal'],
          defaultTitle: 'decimal',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(2)
        .map((row: any[]) => row?.slice(1));

      // cell type should be number and values as expected
      expect(sheetData[0][0]).toBe('p1');
      expect(sheetData[0][1]).toBe(123);
      expect(sheetData[0][2]).toBeCloseTo(123.456);
      expect(sheetData[0][3]).toBeCloseTo(234.567);
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export with map field', async () => {
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          name: 'circle',
          type: 'circle',
          interface: 'circle',
          uiSchema: {
            'x-component-props': { mapType: 'amap' },
            type: 'void',
            'x-component': 'Map',
            'x-component-designer': 'Map.Designer',
            title: 'circle',
          },
        },
      ],
    });

    await app.db.sync();

    await Post.repository.create({
      values: {
        title: 'p1',
        circle: [116.397428, 39.90923, 3241],
      },
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      chunkSize: 10,
      columns: [
        { dataIndex: ['title'], defaultTitle: 'Title' },
        {
          dataIndex: ['circle'],
          defaultTitle: 'circle',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      const header = sheetData[0];
      expect(header).toEqual(['Title', 'circle']);
      const firstUser = sheetData[1];
      expect(firstUser[1]).toEqual('116.397428,39.90923,3241');
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export with attachment field', async () => {
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        {
          name: 'attachment1',
          type: 'belongsToMany',
          interface: 'attachment',
          uiSchema: {
            'x-component-props': {
              accept: 'image/*',
              multiple: true,
            },
            type: 'array',
            'x-component': 'Upload.Attachment',
            title: 'attachment1',
          },
          target: 'attachments',
          storage: 'local',
          through: 'postsAttachments',
        },
      ],
    });

    await app.db.sync();

    await Post.repository.create({
      values: {
        title: 'p1',
        attachment1: [
          {
            title: 'nocobase-logo1',
            filename: '682e5ad037dd02a0fe4800a3e91c283b.png',
            extname: '.png',
            mimetype: 'image/png',
            url: 'https://nocobase.oss-cn-beijing.aliyuncs.com/test1.png',
            storageId: 1,
          },
          {
            title: 'nocobase-logo2',
            filename: '682e5ad037dd02a0fe4800a3e91c283b.png',
            extname: '.png',
            mimetype: 'image/png',
            storageId: 1,
          },
        ],
      },
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      chunkSize: 10,
      columns: [
        { dataIndex: ['title'], defaultTitle: 'Title' },
        {
          dataIndex: ['attachment1'],
          defaultTitle: 'attachment',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    const workbook = new Workbook();
    await workbook.xlsx.readFile(xlsxFilePath);
    const worksheet = workbook.getWorksheet(1);
    const sheetData = worksheet
      .getSheetValues()
      .slice(1)
      .map((row: any[]) => row?.slice(1));
    const header = sheetData[0];
    expect(header).toEqual(['Title', 'attachment']);
    const firstUser = sheetData[1];
    expect(firstUser[1]).toEqual(
      'https://nocobase.oss-cn-beijing.aliyuncs.com/test1.png,/storage/uploads/682e5ad037dd02a0fe4800a3e91c283b.png',
    );
    exporter.cleanOutputFile();
  });

  it('should export with china region field', async () => {
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

    await Post.repository.create({
      values: {
        title: 'post0',
        region: [{ code: '14' }, { code: '1404' }, { code: '140406' }],
      },
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      chunkSize: 10,
      columns: [
        { dataIndex: ['title'], defaultTitle: 'Title' },
        {
          dataIndex: ['region'],
          defaultTitle: 'region',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    const workbook = new Workbook();
    await workbook.xlsx.readFile(xlsxFilePath);
    const worksheet = workbook.getWorksheet(1);
    const sheetData = worksheet
      .getSheetValues()
      .slice(1)
      .map((row: any[]) => row?.slice(1));
    const header = sheetData[0];
    expect(header).toEqual(['Title', 'region']);
    const firstUser = sheetData[1];
    expect(firstUser).toEqual(['post0', '山西省/长治市/潞城区']);
    exporter.cleanOutputFile();
  });
});

describe('export to xlsx', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['action-export'],
    });
  });

  afterEach(async () => {
    await app.destroy();
    vi.unstubAllEnvs();
  });

  it('should throw error when export field not exists', async () => {
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        {
          name: 'title',
          type: 'string',
        },
      ],
    });

    await app.db.sync();

    await Post.repository.create({
      values: {
        title: 'some_title',
        json: {
          a: {
            b: 'c',
          },
        },
      },
    });

    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      chunkSize: 10,
      columns: [{ dataIndex: ['json'], defaultTitle: '' }],
    });

    let error: any;
    try {
      await exporter.run({});
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.message).toContain('not found');
  });

  it('should export with json field', async () => {
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        {
          name: 'title',
          type: 'string',
        },
        {
          name: 'json',
          type: 'json',
        },
      ],
    });

    await app.db.sync();

    await Post.repository.create({
      values: {
        title: 'some_title',
        json: {
          a: {
            b: 'c',
          },
        },
      },
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      chunkSize: 10,
      columns: [
        { dataIndex: ['title'], defaultTitle: '' },
        {
          dataIndex: ['json'],
          defaultTitle: '',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run({});

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      const firstUser = sheetData[1];
      expect(firstUser).toEqual([
        'some_title',
        JSON.stringify({
          a: {
            b: 'c',
          },
        }),
      ]);
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export with datetime field', async () => {
    const Post = app.db.collection({
      name: 'posts',
      fields: [
        {
          name: 'title',
          type: 'string',
        },
        {
          uiSchema: {
            'x-component-props': { dateFormat: 'YYYY-MM-DD', gmt: false, showTime: true, timeFormat: 'HH:mm:ss' },
            type: 'string',
            'x-component': 'DatePicker',
            title: 'test_date',
          },
          name: 'test_date',
          type: 'datetime',
          interface: 'datetime',
        },
      ],
    });

    await app.db.sync();

    await Post.repository.create({
      values: {
        title: 'some_title',
        test_date: '2024-05-10T01:42:35.000Z',
      },
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Post,
      chunkSize: 10,
      columns: [
        { dataIndex: ['title'], defaultTitle: '' },
        {
          dataIndex: ['test_date'],
          defaultTitle: '',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    const workbook = new Workbook();
    await workbook.xlsx.readFile(xlsxFilePath);
    const worksheet = workbook.getWorksheet(1);
    const sheetData = worksheet
      .getSheetValues()
      .slice(1)
      .map((row: any[]) => row?.slice(1));
    const firstUser = sheetData[1];
    expect(firstUser).toEqual(['some_title', '2024-05-10 01:42:35']);
    exporter.cleanOutputFile();
  });

  it('should export with multi select', async () => {
    const User = app.db.collection({
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
      ],
    });

    await app.db.sync();

    await User.repository.create({
      values: {
        name: 'u1',
        multiSelect: ['123', '223'],
      },
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        {
          dataIndex: ['multiSelect'],
          defaultTitle: '',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    const workbook = new Workbook();
    await workbook.xlsx.readFile(xlsxFilePath);
    const worksheet = workbook.getWorksheet(1);
    const sheetData = worksheet
      .getSheetValues()
      .slice(1)
      .map((row: any[]) => row?.slice(1));
    const firstUser = sheetData[1];
    expect(firstUser).toEqual(['u1', 'Label123,Label223']);
    exporter.cleanOutputFile();
  });

  it('should export with different ui schema', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name', title: '姓名' },
        { type: 'integer', name: 'age', title: '年龄' },
        {
          type: 'integer',
          name: 'testInterface',
          interface: 'testInterface',
          title: 'Interface 测试',
          uiSchema: { test: 'testValue' },
        },
      ],
    });

    class TestInterface extends BaseInterface {
      toString(value, ctx) {
        return `${this.options.uiSchema.test}.${value}`;
      }
    }

    app.db.interfaceManager.registerInterfaceType('testInterface', TestInterface);

    await app.db.sync();
    const values = Array.from({ length: 20 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
        testInterface: index,
      };
    });

    await User.model.bulkCreate(values);

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        {
          dataIndex: ['testInterface'],
          defaultTitle: '',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      const header = sheetData[0];
      expect(header).toEqual(['姓名', 'Interface 测试']);

      const firstUser = sheetData[1];
      expect(firstUser).toEqual(['user0', 'testValue.0']);
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export with custom title', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name', title: '姓名' },
        { type: 'integer', name: 'age', title: '年龄' },
      ],
    });

    await app.db.sync();
    const values = Array.from({ length: 20 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
      };
    });

    await User.model.bulkCreate(values);

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], title: '123', defaultTitle: 'Name' },
        { dataIndex: ['age'], title: '345', defaultTitle: 'Age' },
      ],
      findOptions: {
        filter: {
          age: {
            $gt: 9,
          },
        },
      },
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      const header = sheetData[0];
      expect(header).toEqual(['123', '345']);
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export with empty title', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name', title: '姓名' },
        { type: 'integer', name: 'age', title: '年龄' },
      ],
    });

    await app.db.sync();
    const values = Array.from({ length: 20 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
      };
    });

    await User.model.bulkCreate(values);

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['age'], defaultTitle: 'Age' },
      ],
      findOptions: {
        filter: {
          age: {
            $gt: 9,
          },
        },
      },
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      const header = sheetData[0];
      expect(header).toEqual(['姓名', '年龄']);
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export with filter', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
      ],
    });

    await app.db.sync();

    const values = Array.from({ length: 20 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
      };
    });

    await User.model.bulkCreate(values);

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['age'], defaultTitle: 'Age' },
      ],
      findOptions: {
        filter: {
          age: {
            $gt: 9,
          },
        },
      },
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      expect(sheetData.length).toBe(11); // 10 users + 1 header

      const header = sheetData[0];
      expect(header).toEqual(['Name', 'Age']);

      const firstUser = sheetData[1];
      expect(firstUser).toEqual(['user10', 10]);
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export with associations', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
        {
          type: 'hasMany',
          name: 'posts',
          target: 'posts',
        },
        {
          type: 'belongsToMany',
          name: 'groups',
          target: 'groups',
          through: 'usersGroups',
        },
        {
          name: 'createdAt',
          type: 'date',
          interface: 'createdAt',
          field: 'createdAt',
          uiSchema: {
            type: 'datetime',
            title: '{{t("Created at")}}',
            'x-component': 'DatePicker',
            'x-component-props': {},
            'x-read-pretty': true,
          },
        },
      ],
    });

    const Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user', target: 'users' },
      ],
    });

    const Group = app.db.collection({
      name: 'groups',
      fields: [{ type: 'string', name: 'name' }],
    });

    await app.db.sync();

    const [group1, group2, group3] = await Group.repository.create({
      values: [{ name: 'group1' }, { name: 'group2' }, { name: 'group3' }],
    });

    const values = Array.from({ length: 22 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
        groups: [
          {
            id: group1.get('id'),
          },
          {
            id: group2.get('id'),
          },
          {
            id: group3.get('id'),
          },
        ],
        posts: Array.from({ length: 3 }).map((_, postIndex) => {
          return {
            title: `post${postIndex}`,
          };
        }),
      };
    });

    await User.repository.create({
      values,
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['age'], defaultTitle: 'Age' },
        { dataIndex: ['posts', 'title'], defaultTitle: 'Post Title' },
        { dataIndex: ['groups', 'name'], defaultTitle: 'Group Names' },
        { dataIndex: ['createdAt'], defaultTitle: 'Created at' },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      expect(sheetData.length).toBe(23); // 22 users * 3 posts + 1 header

      const header = sheetData[0];
      expect(header).toEqual(['Name', 'Age', 'Post Title', 'Group Names', 'Created at']);

      const firstUser = sheetData[1];
      expect(firstUser).toEqual([
        'user0',
        0,
        'post0,post1,post2',
        'group1,group2,group3',
        moment().format('YYYY-MM-DD'),
      ]);
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export data to xlsx', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
      ],
    });

    await app.db.sync();

    const values = Array.from({ length: 22 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
      };
    });

    await User.model.bulkCreate(values);

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['age'], defaultTitle: 'Age' },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      expect(sheetData.length).toBe(23); // 22 users + 1 header

      const header = sheetData[0];
      expect(header).toEqual(['Name', 'Age']);

      const firstUser = sheetData[1];
      expect(firstUser).toEqual(['user0', 0]);
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should export with different ui schema in associations', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
        {
          type: 'hasMany',
          name: 'posts',
          target: 'posts',
        },
        {
          type: 'belongsToMany',
          name: 'groups',
          target: 'groups',
          through: 'usersGroups',
        },
        {
          name: 'createdAt',
          type: 'date',
          interface: 'createdAt',
          field: 'createdAt',
          uiSchema: {
            type: 'datetime',
            title: '{{t("Created at")}}',
            'x-component': 'DatePicker',
            'x-component-props': {},
            'x-read-pretty': true,
          },
        },
      ],
    });

    const Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user', target: 'users' },
      ],
    });

    const Group = app.db.collection({
      name: 'groups',
      fields: [
        { type: 'string', name: 'name' },
        {
          type: 'integer',
          name: 'testInterface',
          interface: 'testInterface',
          title: 'Associations interface 测试',
          uiSchema: { test: 'testValue' },
        },
      ],
    });

    class TestInterface extends BaseInterface {
      toString(value, ctx) {
        return `${this.options.uiSchema.test}.${value}`;
      }
    }

    app.db.interfaceManager.registerInterfaceType('testInterface', TestInterface);

    await app.db.sync();

    const [group1, group2, group3] = await Group.repository.create({
      values: [
        { name: 'group1', testInterface: 1 },
        { name: 'group2', testInterface: 2 },
        { name: 'group3', testInterface: 3 },
      ],
    });

    const values = Array.from({ length: 22 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
        groups: [
          {
            id: group1.get('id'),
          },
          {
            id: group2.get('id'),
          },
          {
            id: group3.get('id'),
          },
        ],
        posts: Array.from({ length: 3 }).map((_, postIndex) => {
          return {
            title: `post${postIndex}`,
          };
        }),
      };
    });

    await User.repository.create({
      values,
    });

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        {
          dataIndex: ['groups', 'testInterface'],
          defaultTitle: 'Test Field',
        },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();

    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      const header = sheetData[0];
      expect(header).toEqual(['Name', 'Associations interface 测试']);

      const firstUser = sheetData[1];
      expect(firstUser).toEqual(['user0', 'testValue.1,testValue.2,testValue.3']);
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should respect the EXPORT_LIMIT env variable', async () => {
    vi.stubEnv('EXPORT_LIMIT', '30'); // Set a small limit

    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
      ],
    });

    await app.db.sync();

    const values = Array.from({ length: 100 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
      };
    });

    await User.model.bulkCreate(values);

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['age'], defaultTitle: 'Age' },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();
    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      expect(sheetData.length).toBe(31); // 30 users + 1 header
      expect(sheetData[0]).toEqual(['Name', 'Age']); // header
      expect(sheetData[1]).toEqual(['user0', 0]); // first user
      expect(sheetData[30]).toEqual(['user29', 29]); // last user
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should use default EXPORT_LIMIT (2000) when env not set', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
      ],
    });

    await app.db.sync();

    const values = Array.from({ length: 2500 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
      };
    });

    await User.model.bulkCreate(values);

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['age'], defaultTitle: 'Age' },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();
    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      expect(sheetData.length).toBe(2001); // 2000 users + 1 header
      expect(sheetData[0]).toEqual(['Name', 'Age']); // header
      expect(sheetData[1]).toEqual(['user0', 0]); // first user
      expect(sheetData[2000]).toEqual(['user1999', 99]); // last user
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should respect the limit option when exporting data', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        { type: 'string', name: 'name' },
        { type: 'integer', name: 'age' },
      ],
    });

    await app.db.sync();

    const values = Array.from({ length: 100 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
      };
    });

    await User.model.bulkCreate(values);

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: User,
      chunkSize: 10,
      limit: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['age'], defaultTitle: 'Age' },
      ],
      outputPath: xlsxFilePath,
    });

    await exporter.run();
    try {
      const workbook = new Workbook();
      await workbook.xlsx.readFile(xlsxFilePath);
      const worksheet = workbook.getWorksheet(1);
      const sheetData = worksheet
        .getSheetValues()
        .slice(1)
        .map((row: any[]) => row?.slice(1));
      expect(sheetData.length).toBe(11); // 10 users + 1 header
      expect(sheetData[0]).toEqual(['Name', 'Age']); // header
      expect(sheetData[1]).toEqual(['user0', 0]); // first user
      expect(sheetData[10]).toEqual(['user9', 9]); // last user
    } finally {
      exporter.cleanOutputFile();
    }
  });

  it('should import rich text field successfully when long text', async () => {
    const Test = app.db.collection({
      name: 'tests',
      fields: [
        {
          interface: 'richText',
          type: 'text',
          name: 'richText',
        },
      ],
    });

    await app.db.sync();
    const data = require('./data/rich-text.json');
    const longText = data.longText;
    await Test.repository.create({
      values: {
        richText: longText,
      },
    });
    const exporter = new XlsxExporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Test,
      chunkSize: 10,
      limit: 10,
      columns: [{ dataIndex: ['richText'], defaultTitle: 'richText' }],
    });
    await exporter.run();
    const buffer = exporter.getXlsxBuffer();
    exporter.cleanOutputFile();
    expect(buffer).exist;
  });
});
