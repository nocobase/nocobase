import { getApp } from '.';

describe('attachment', () => {
  let db;
  let app;

  beforeEach(async () => {
    app = await getApp();
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should linked to a instance', async () => {
    const testCollection = db.collection({
      name: 'test',
      fields: [
        {
          name: 'name',
          type: 'string',
        },
        {
          type: 'belongsTo',
          name: 'logo',
          target: 'attachments',
        },
      ],
    });

    await db.sync();

    await testCollection.repository.create({
      values: {
        name: 'test',
        logo: {
          title: 'nocobase-logo',
          filename: '682e5ad037dd02a0fe4800a3e91c283b.png',
          extname: '.png',
          mimetype: 'image/png',
          url: 'https://nocobase.oss-cn-beijing.aliyuncs.com/682e5ad037dd02a0fe4800a3e91c283b.png',
        },
      },
    });

    const item = await testCollection.repository.findOne({});
    expect(item.get('logoId')).toBeDefined();
  });
});
