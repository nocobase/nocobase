import { createMockServer, MockServer } from '@nocobase/test';

describe('acl', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['nocobase'],
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should add importXlsx action to default role strategy', async () => {
    const roles = ['admin', 'member'];
    for (const roleName of roles) {
      const role = app.acl.getRole(roleName);
      expect(role.strategy['actions']).toContain('importXlsx');
    }
  });
});
