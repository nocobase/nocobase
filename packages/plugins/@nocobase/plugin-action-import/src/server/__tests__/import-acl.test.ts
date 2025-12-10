/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { MockServer, createMockServer } from '@nocobase/test';
import { TemplateCreator } from '../services/template-creator';
import XLSX from 'xlsx';
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
});
