import { MockServer, mockServer } from '@nocobase/test';
import Migration from '../migrations/20231215215247-admin-menu-uid';

// 每个插件的 app 最小化安装的插件都不一样，需要插件根据自己的情况添加必备插件
async function createApp(options: any = {}) {
  const app = mockServer({
    ...options,
    plugins: ['client', 'ui-schema-storage', 'system-settings'].concat(options.plugins || []),
  });
  // 这里可以补充一些需要特殊处理的逻辑，比如导入测试需要的数据表
  return app;
}

// 大部分的测试都需要启动应用，所以也可以提供一个通用的启动方法
async function startApp() {
  const app = await createApp();
  await app.quickstart({
    // 运行测试前，清空数据库
    clean: true,
  });
  return app;
}

describe('nocobase-admin-menu', () => {
  let app: MockServer;

  beforeEach(async () => {
    app = await startApp();
  });

  afterEach(async () => {
    // 运行测试后，清空数据库
    await app.destroy();
    // 只停止不清空数据库
    // await app.stop();
  });

  test('migration', async () => {
    const uiSchemas = app.db.getModel('uiSchemas');
    const systemSettings = app.db.getRepository('systemSettings');
    await uiSchemas.truncate();
    await app.db.getModel('uiSchemaTreePath').truncate();
    await uiSchemas.create({
      'x-uid': 'abc',
      name: 'abc',
    });
    const instance = await systemSettings.findOne();
    instance.set('options', {
      adminSchemaUid: 'abc',
    });
    await instance.save();
    const migration = new Migration({
      db: app.db,
      // @ts-ignore
      app: app,
    });
    await migration.up();
    const schema = await uiSchemas.findOne();
    expect(schema.toJSON()).toMatchObject({ 'x-uid': 'nocobase-admin-menu', name: 'abc' });
  });
});
