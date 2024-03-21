import Database from '@nocobase/database';
import { createMockServer, MockServer } from '@nocobase/test';
import { UserModel } from '../models/UserModel';

describe('models', () => {
  let app: MockServer;
  let db: Database;

  beforeEach(async () => {
    app = await createMockServer({
      plugins: ['auth', 'users'],
    });
    db = app.db;
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('model registeration', async () => {
    const model = db.getModel('users');
    const u1 = model.build({ nickname: 'test', password: '123' });
    expect(u1).toBeInstanceOf(UserModel);
    const n = u1.desensitize();
    expect(n.password).toBeUndefined();
  });
});
