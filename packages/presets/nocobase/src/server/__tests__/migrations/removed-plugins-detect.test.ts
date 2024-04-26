import { Repository } from '@nocobase/database';
import { MockServer, createMockServer } from '@nocobase/test';
import Migration from '../../migrations/20240424125531-removed-plugins-detect';

describe('removed plugin detect', () => {
  let app: MockServer;
  let repo: Repository;

  beforeEach(async () => {
    app = await createMockServer({
      version: '0.21.0-alpha.15',
    });
    repo = app.db.getRepository('applicationPlugins');
  });

  afterEach(async () => {
    vi.resetAllMocks();
    await app.db.clean({ drop: true });
    await app.destroy();
  });

  it('should delete removed but not enabled plugins', async () => {
    vi.spyOn(Migration.prototype, 'getPackageName').mockRejectedValue(new Error('not found'));
    await repo.create({
      values: {
        name: 'saml',
        packageName: '@nocobase/plugin-saml',
        version: '0.21.0-alpha.15',
        enabled: false,
      },
    });
    const migration = new Migration({
      db: app.db,
      // @ts-ignore
      app: app,
    });
    await migration.up();
    const exists = await repo.count({
      filter: {
        name: 'saml',
      },
    });
    expect(exists).toBe(0);
  });

  it('should throw error when enabled plugin not found', async () => {
    vi.spyOn(Migration.prototype, 'getPackageName').mockRejectedValue(new Error('not found'));
    await repo.create({
      values: {
        name: 'saml',
        packageName: '@nocobase/plugin-saml',
        version: '0.21.0-alpha.15',
        enabled: true,
      },
    });
    const migration = new Migration({
      db: app.db,
      // @ts-ignore
      app: app,
    });
    await expect(migration.up()).rejects.toThrowError();
  });
});
