import { mockServer, MockServer } from '@nocobase/test';

describe('application version', () => {
  let app: MockServer;
  afterEach(async () => {
    if (app) {
      await app.destroy();
    }
  });

  it('should get application version', async () => {
    app = mockServer();
    await app.db.sync();
    const appVersion = app.version;

    await appVersion.update();
    expect(await appVersion.get()).toBeDefined();
  });
});
