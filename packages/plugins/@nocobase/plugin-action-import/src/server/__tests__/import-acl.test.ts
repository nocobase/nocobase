/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Context } from '@nocobase/actions';
import { MockServer, createMockServer } from '@nocobase/test';
import { importXlsx } from '../actions/import-xlsx';
import { TemplateCreator } from '../services/template-creator';
import * as XLSX from 'xlsx';
import { XlsxImporter } from '../services/xlsx-importer';

describe('xlsx importer', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = await createMockServer();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should import by acl settings', async () => {
    const Test = app.db.collection({
      name: 'test',
      fields: [
        {
          type: 'string',
          name: 'f1',
        },
        {
          type: 'string',
          name: 'f2',
        },
        {
          type: 'string',
          name: 'f3',
        },
        {
          type: 'string',
          name: 'f4',
        },
        {
          type: 'string',
          name: 'f5',
        },
      ],
    });

    await app.db.sync();
    const columns = [
      {
        dataIndex: ['f1'],
        defaultTitle: 'f1',
      },
      {
        dataIndex: ['f2'],
        defaultTitle: 'f2',
      },
      {
        dataIndex: ['f3'],
        defaultTitle: 'f3',
      },
      {
        dataIndex: ['f4'],
        defaultTitle: 'f4',
      },
      {
        dataIndex: ['f5'],
        defaultTitle: 'f5',
      },
    ];

    const templateCreator = new TemplateCreator({
      collection: Test,
      columns,
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(worksheet, [['f1', 'f2', 'f3', 'f4', 'f5']], { origin: 'A2' });

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Test,
      columns,
      workbook: template,
    });

    await importer.run({
      context: {
        permission: {
          can: {
            params: {
              fields: ['f1', 'f3', 'f5'],
            },
          },
        },
      },
    });

    const test = await Test.repository.findOne();
    expect(test.f1).toBe('f1');
    expect(test.f2).toBeFalsy();
    expect(test.f3).toBe('f3');
    expect(test.f4).toBeFalsy();
    expect(test.f5).toBe('f5');
  });

  it('keeps collection defaults when importing through the action', async () => {
    const posts = app.db.collection({
      name: 'posts',
      fields: [
        { name: 'title', type: 'string' },
        { name: 'category', type: 'string', defaultValue: 'general' },
      ],
    });
    await app.db.sync();

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Title'], ['First post']]), 'Posts');
    const ctx = {
      action: { params: { rowDefaultValues: { category: 'other' } } },
      permission: { can: { params: { fields: ['title'] } } },
      request: { body: { columns: [{ dataIndex: ['title'], defaultTitle: 'Title' }] } },
      file: { buffer: XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) },
      dataSource: app.mainDataSource,
      getCurrentRepository: () => posts.repository,
    } as unknown as Context;

    await importXlsx(ctx, async () => {});

    const record = await posts.repository.findOne();
    expect(record.get('id')).toBeTruthy();
    expect(record.get('title')).toBe('First post');
    expect(record.get('category')).toBe('general');
  });

  it('should not treat acl fixed params as field restrictions', async () => {
    const Test = app.db.collection({
      name: 'test_with_filter_only_acl',
      fields: [
        {
          type: 'string',
          name: 'title',
        },
        {
          type: 'string',
          name: 'content',
        },
        { type: 'string', name: 'source' },
      ],
    });

    await app.db.sync();

    const columns = [
      {
        dataIndex: ['title'],
        defaultTitle: 'title',
      },
      {
        dataIndex: ['content'],
        defaultTitle: 'content',
      },
    ];

    const templateCreator = new TemplateCreator({
      collection: Test,
      columns,
    });

    const template = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;

    const worksheet = template.Sheets[template.SheetNames[0]];

    XLSX.utils.sheet_add_aoa(worksheet, [['hello', 'world']], { origin: 'A2' });

    const importer = new XlsxImporter({
      collectionManager: app.mainDataSource.collectionManager,
      collection: Test,
      columns,
      workbook: template,
      rowDefaultValues: { source: 'server', title: 'default title' },
    });

    await importer.run({
      context: {
        permission: {
          can: {
            params: {
              filter: {
                spaceName: 'space-a',
              },
            },
          },
        },
      },
    });

    const record = await Test.repository.findOne();
    expect(record.title).toBe('hello');
    expect(record.content).toBe('world');
    expect(record.source).toBe('server');
  });
});
