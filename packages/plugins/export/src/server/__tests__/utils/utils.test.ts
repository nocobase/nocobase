import Database from '@nocobase/database';
import { mockServer, MockServer } from '@nocobase/test';

describe('utils', () => {
  let columns = null;
  let db: Database;
  let app: MockServer;

  beforeEach(async () => {
    app = mockServer();
    db = app.db;
  });
  afterEach(async () => {});

  it('first columns2Appends', async () => {
    columns = [
      { dataIndex: ['f_kp6gk63udss'], defaultTitle: '商品名称' },
      {
        dataIndex: ['f_brjkofr2mbt'],
        enum: [
          { value: 'lzjqrrw2vdl', label: '节' },
          { value: 'i0qarqlm87m', label: '胡' },
          { value: '1fpb8x0swq1', label: '一一' },
        ],
        defaultTitle: '工在在',
      },
      { dataIndex: ['f_qhvvfuignh2', 'createdBy', 'id'], defaultTitle: 'ID' },
      { dataIndex: ['f_wu28mus1c65', 'roles', 'title'], defaultTitle: '角色名称' },
    ];
    // const appends = columns2Appends(columns, app);
    // expect(appends).toMatchObject(['f_qhvvfuignh2.createdBy', 'f_wu28mus1c65.roles']);
  });

  it('second columns2Appends', async () => {
    columns = [
      { dataIndex: ['f_kp6gk63udss'], defaultTitle: '商品名称' },
      {
        dataIndex: ['f_brjkofr2mbt'],
        enum: [
          { value: 'lzjqrrw2vdl', label: '节' },
          { value: 'i0qarqlm87m', label: '胡' },
          { value: '1fpb8x0swq1', label: '一一' },
        ],
        defaultTitle: '工在在',
      },
      { dataIndex: ['f_qhvvfuignh2', 'createdBy', 'id'], defaultTitle: 'ID' },
      { dataIndex: ['f_qhvvfuignh2', 'createdBy', 'nickname'], defaultTitle: '角色名称' },
    ];
    // const appends = columns2Appends(columns, app);
    // expect(appends).toMatchObject(['f_qhvvfuignh2.createdBy']);
  });
});
