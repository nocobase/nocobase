import { mockServer } from '@nocobase/test';

describe('create with exception', () => {
  it('should handle not null error', async () => {
    const app = mockServer();

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

    await app.destroy();
  });

  it('should handle unique error', async () => {
    const app = mockServer();

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

    await app.destroy();
  });
});
