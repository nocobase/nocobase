import { MockServer, mockServer } from '@nocobase/test';
import { PluginErrorHandler } from '../server';
describe('create with exception', () => {
  let app: MockServer;
  beforeEach(async () => {
    app = mockServer();
    app.plugin(PluginErrorHandler);
  });

  afterEach(async () => {
    await app.destroy();
  });

  it('should handle not null error', async () => {
    app.collection({
      name: 'users',
      fields: [
        {
          name: 'name',
          type: 'string',
          allowNull: false,
        },
      ],
    });

    await app.loadAndInstall();

    const response = await app
      .agent()
      .resource('users')
      .create({
        values: {
          title: 't1',
        },
      });

    expect(response.statusCode).toEqual(400);

    expect(response.body).toEqual({
      errors: [
        {
          message: 'name cannot be null',
        },
      ],
    });
  });

  it('should handle unique error', async () => {
    app.collection({
      name: 'users',
      fields: [
        {
          name: 'name',
          type: 'string',
          unique: true,
        },
      ],
    });

    await app.loadAndInstall();

    await app
      .agent()
      .resource('users')
      .create({
        values: {
          name: 'u1',
        },
      });

    const response = await app
      .agent()
      .resource('users')
      .create({
        values: {
          name: 'u1',
        },
      });

    expect(response.statusCode).toEqual(400);

    expect(response.body).toEqual({
      errors: [
        {
          message: 'name must be unique',
        },
      ],
    });
  });
});
