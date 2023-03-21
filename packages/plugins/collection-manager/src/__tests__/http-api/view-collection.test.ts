import { MockServer } from '@nocobase/test';
import { createApp } from '../index';

describe('view collection', () => {
  let app: MockServer;
  let agent;

  beforeEach(async () => {
    app = await createApp();
    agent = app.agent();
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should list views', async () => {});
});
