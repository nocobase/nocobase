import { mockServer, MockServer } from "../";

describe('mock server', () => {
  let api: MockServer;

  beforeEach(() => {
    api = mockServer({
      dataWrapping: false,
    });
    api.resourcer.registerActionHandlers({
      list: async (ctx, next) => {
        ctx.body = [1, 2];
        await next();
      },
    });
    api.resourcer.define({
      name: 'test',
    });
  });

  afterEach(async () => {
    return api.destroy();
  });

  it('agent', async () => {
    const response = await api.agent().get('/test');
    expect(response.body).toEqual([1, 2]);
  });

  it('resource', async () => {
    const response = await api.agent().resource('test').list();
    expect(response.body).toEqual([1, 2]);
  });
});
