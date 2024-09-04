import { createMockServer, MockServer } from '@nocobase/test';
import fs from 'fs';
import os from 'os';
import path from 'path';
import XLSX from 'xlsx';

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

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);
    expect(rows.length).toBe(1);
  });
});
