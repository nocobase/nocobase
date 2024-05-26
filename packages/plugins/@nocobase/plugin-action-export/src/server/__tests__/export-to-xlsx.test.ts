/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import { uid } from '@nocobase/utils';
import XlsxExporter from '../xlsx-exporter';
import XLSX from 'xlsx';
import fs from 'fs';

XLSX.set_fs(fs);
import path from 'path';
import { BaseInterface } from '@nocobase/database';

describe('export to xlsx', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['action-export'],
    });
  });

  afterEach(async () => {
    await app.destroy();
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

    const exporter = new XlsxExporter({
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        {
          dataIndex: ['testInterface'],
          defaultTitle: '',
        },
      ],
    });

    const wb = await exporter.run();

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    try {
      await new Promise((resolve, reject) => {
        XLSX.writeFileAsync(
          xlsxFilePath,
          wb,
          {
            type: 'array',
          },
          () => {
            resolve(123);
          },
        );
      });

      // read xlsx file
      const workbook = XLSX.readFile(xlsxFilePath);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const sheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      console.log(sheetData);
      const header = sheetData[0];
      expect(header).toEqual(['姓名', 'Interface 测试']);

      const firstUser = sheetData[1];
      expect(firstUser).toEqual(['user0', 'testValue.0']);
    } finally {
      fs.unlinkSync(xlsxFilePath);
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

    const exporter = new XlsxExporter({
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
    });

    const wb = await exporter.run();

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    try {
      await new Promise((resolve, reject) => {
        XLSX.writeFileAsync(
          xlsxFilePath,
          wb,
          {
            type: 'array',
          },
          () => {
            resolve(123);
          },
        );
      });

      // read xlsx file
      const workbook = XLSX.readFile(xlsxFilePath);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const sheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

      const header = sheetData[0];
      expect(header).toEqual(['姓名', '年龄']);
    } finally {
      fs.unlinkSync(xlsxFilePath);
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

    const exporter = new XlsxExporter({
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
    });

    const wb = await exporter.run();

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    try {
      await new Promise((resolve, reject) => {
        XLSX.writeFileAsync(
          xlsxFilePath,
          wb,
          {
            type: 'array',
          },
          () => {
            resolve(123);
          },
        );
      });

      // read xlsx file
      const workbook = XLSX.readFile(xlsxFilePath);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const sheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      expect(sheetData.length).toBe(11); // 10 users + 1 header

      const header = sheetData[0];
      expect(header).toEqual(['Name', 'Age']);

      const firstUser = sheetData[1];
      expect(firstUser).toEqual(['user10', 10]);
    } finally {
      fs.unlinkSync(xlsxFilePath);
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
      ],
    });

    const Post = app.db.collection({
      name: 'posts',
      fields: [
        { type: 'string', name: 'title' },
        { type: 'belongsTo', name: 'user', target: 'users' },
      ],
    });

    await app.db.sync();

    const values = Array.from({ length: 22 }).map((_, index) => {
      return {
        name: `user${index}`,
        age: index % 100,
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

    const exporter = new XlsxExporter({
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['age'], defaultTitle: 'Age' },
        { dataIndex: ['posts', 'title'], defaultTitle: 'Post Title' },
      ],
    });

    const wb = await exporter.run();

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    try {
      await new Promise((resolve, reject) => {
        XLSX.writeFileAsync(
          xlsxFilePath,
          wb,
          {
            type: 'array',
          },
          () => {
            resolve(123);
          },
        );
      });

      // read xlsx file
      const workbook = XLSX.readFile(xlsxFilePath);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const sheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      expect(sheetData.length).toBe(23); // 22 users * 3 posts + 1 header

      const header = sheetData[0];
      expect(header).toEqual(['Name', 'Age', 'Post Title']);

      const firstUser = sheetData[1];
      expect(firstUser).toEqual(['user0', 0, 'post0,post1,post2']);
    } finally {
      fs.unlinkSync(xlsxFilePath);
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

    const exporter = new XlsxExporter({
      collection: User,
      chunkSize: 10,
      columns: [
        { dataIndex: ['name'], defaultTitle: 'Name' },
        { dataIndex: ['age'], defaultTitle: 'Age' },
      ],
    });

    const wb = await exporter.run();

    const xlsxFilePath = path.resolve(__dirname, `t_${uid()}.xlsx`);
    try {
      await new Promise((resolve, reject) => {
        XLSX.writeFileAsync(
          xlsxFilePath,
          wb,
          {
            type: 'array',
          },
          () => {
            resolve(123);
          },
        );
      });

      // read xlsx file
      const workbook = XLSX.readFile(xlsxFilePath);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const sheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
      expect(sheetData.length).toBe(23); // 22 users + 1 header

      const header = sheetData[0];
      expect(header).toEqual(['Name', 'Age']);

      const firstUser = sheetData[1];
      expect(firstUser).toEqual(['user0', 0]);
    } finally {
      fs.unlinkSync(xlsxFilePath);
    }
  });
});
