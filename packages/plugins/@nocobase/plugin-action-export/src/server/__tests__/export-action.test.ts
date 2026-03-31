/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockServer, MockServer } from '@nocobase/test';
import { Workbook } from 'exceljs';

describe('export action', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase'],
      acl: false,
    });
  });

  it('should export with association repository', async () => {
    await app.db.getRepository('collections').create({
      values: {
        name: 'posts',
        fields: [
          {
            name: 'title',
            type: 'string',
          },
          {
            name: 'comments',
            type: 'hasMany',
            target: 'comments',
          },
        ],
      },
      context: {},
    });

    await app.db.getRepository('collections').create({
      values: {
        name: 'comments',
        fields: [
          {
            name: 'content',
            type: 'string',
          },
        ],
      },
      context: {},
    });

    await app.db.getRepository('posts').create({
      values: [
        {
          title: 'post1',
          comments: [
            {
              content: 'comment1',
            },
          ],
        },
        {
          title: 'post2',
          comments: [
            {
              content: 'comment2',
            },
          ],
        },
      ],
    });

    const res = await app
      .agent()
      .resource('posts.comments', 1)
      .export({
        values: {
          columns: [{ dataIndex: ['content'], defaultTitle: 'content' }],
        },
      });

    expect(res.status).toBe(200);

    const buffer = res.body;
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet(1);
    const sheetData = worksheet
      .getSheetValues()
      .slice(1)
      .map((row: any[]) => row?.slice(1));
    const rows = sheetData[0];
    expect(rows.length).toBe(1);
  });
});
