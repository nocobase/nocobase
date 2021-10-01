import { mockServer, MockServer } from '@nocobase/test';
import { registerActions } from '@nocobase/actions';

describe('ui_schemas', () => {
  let api: MockServer;
  beforeEach(async () => {
    api = mockServer();
  });

  afterEach(async () => {
    await api.destroy();
  });

  it('create ui_schemas', async () => {
    expect(1).toBe(1);
  });
});
