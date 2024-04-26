import { Repository } from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';
import Migration from '../../migrations/20240426123538-delete-pkg-name-ns';

describe('delete pkg name', () => {
  let app: MockServer;
  let repo: Repository;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['localization'], // 插件
      version: '0.21.0-alpha.15', // 升级前的版本
    });
    repo = app.db.getRepository('localizationTexts');
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should delete pkg name module', async () => {
    await repo.create({
      values: [
        {
          module: 'resources.@nocobase/plugin-for-test',
          text: 'test',
        },
        {
          module: 'resources.for-test',
          text: 'test',
        },
        {
          module: 'resources.@nocobase/plugin-for-test2',
          text: 'test',
        },
        {
          module: 'resources.@custom/plugin-for-test',
          text: 'test',
        },
        {
          module: 'resources.@nocobase/plugin-cas',
          text: 'test',
        },
        {
          module: 'resources.cas',
          text: 'test',
        },
      ],
    });
    const migration = new Migration({
      db: app.db,
      // @ts-ignore
      app: {
        localeManager: {
          getCacheResources: async () => ({
            '@nocobase/plugin-for-test': {},
            'for-test': {},
            '@nocobase/plugin-for-test2': {},
            '@custom/plugin-for-test': {},
            'auth-cas': {},
            '@nocobase/plugin-auth-cas': {},
          }),
        },
      },
    });
    await migration.up();
    const result = await repo.find();
    expect(result.length).toBe(4);
    expect(result.map((item) => item.module)).toMatchObject([
      'resources.for-test',
      'resources.@nocobase/plugin-for-test2',
      'resources.@custom/plugin-for-test',
      'resources.cas',
    ]);
  });
});
