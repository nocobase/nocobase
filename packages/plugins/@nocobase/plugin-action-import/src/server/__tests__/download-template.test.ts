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
import XLSX from 'xlsx';

describe('download template', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = await createMockServer({});
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should render template with explain', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
          title: 'Name',
        },
        {
          type: 'string',
          name: 'email',
          title: 'Email',
        },
      ],
    });

    const explain = 'Please fill in the following information:';

    const templateCreator = new TemplateCreator({
      collection: User,
      explain,
      title: 'UsersImportTemplate',
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: 'Name',
        },
        {
          dataIndex: ['email'],
          defaultTitle: 'Email',
        },
      ],
    });

    const workbook = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
    const sheet0 = workbook.Sheets[workbook.SheetNames[0]];
    const sheetData = XLSX.utils.sheet_to_json(sheet0, { header: 1, defval: null, raw: false });

    const explainData = sheetData[0];
    expect(explainData[0]).toEqual(explain);

    const headerData = sheetData[1];
    expect(headerData[0]).toEqual('Name');
    expect(headerData[1]).toEqual('Email');
  });

  it('should render template', async () => {
    const User = app.db.collection({
      name: 'users',
      fields: [
        {
          type: 'string',
          name: 'name',
          title: 'Name',
        },
        {
          type: 'string',
          name: 'email',
          title: 'Email',
        },
      ],
    });

    const templateCreator = new TemplateCreator({
      collection: User,
      title: 'UsersImportTemplate',
      columns: [
        {
          dataIndex: ['name'],
          defaultTitle: 'Name',
        },
        {
          dataIndex: ['email'],
          defaultTitle: 'Email',
        },
      ],
    });

    const workbook = (await templateCreator.run({ returnXLSXWorkbook: true })) as XLSX.WorkBook;
    const sheet0 = workbook.Sheets[workbook.SheetNames[0]];
    const sheetData = XLSX.utils.sheet_to_json(sheet0, { header: 1, defval: null, raw: false });
    const headerData = sheetData[0];
    expect(headerData).toEqual(['Name', 'Email']);
  });
});
