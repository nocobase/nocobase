import { createMockServer, MockServer } from '@nocobase/test';
import { ErrorHandler } from '../errors/handler';

describe('create with exception', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = await createMockServer({
      acl: false,
    });
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should get error handler instance', async () => {
    const handler = app.errorHandler;
    expect(handler).toBeTruthy();
    expect(handler).toBeInstanceOf(ErrorHandler);
  });
});
