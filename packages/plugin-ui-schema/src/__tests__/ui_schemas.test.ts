import { mockServer, MockServer } from '@nocobase/test';
import { registerActions } from '@nocobase/actions';

describe('ui_schemas', () => {
  let api: MockServer;
  beforeEach(async () => {
    api = mockServer();
    registerActions(api);
    api.registerPlugin('ui-schema', require('../server').default);
    await api.loadPlugins();
  });

  afterEach(async () => {
    await api.destroy();
  });

  it('create ui_schemas', async () => {
    expect(1).toBe(1);
  });
});
