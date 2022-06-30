import { columns2Appends } from '../../utils';

describe('utils', () => {
  let columns = null;
  beforeEach(async () => {
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
  });
  afterEach(async () => {});

  it('columns2Appends', async () => {
    const appends = columns2Appends(columns);
    expect(appends).toMatchObject(['f_qhvvfuignh2.createdBy', 'f_wu28mus1c65.roles']);
  });
});
