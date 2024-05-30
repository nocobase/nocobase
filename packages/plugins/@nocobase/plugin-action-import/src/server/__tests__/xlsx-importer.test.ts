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
import { XlsxImporter } from '../actions/xlsx-importer';
import XLSX from 'xlsx';

describe('xlsx importer', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = await createMockServer({});
  });

  afterEach(async () => {
    await app.destroy();
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
      importer.getData();
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

    const template = await templateCreator.run();

    const importer = new XlsxImporter({
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
      importer.getData();
    } catch (e) {
      error = e;
    }

    expect(error).toBeFalsy();
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

    const template = await templateCreator.run();

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

    await importer.run();

    expect(await User.repository.count()).toBe(2);
  });
});
