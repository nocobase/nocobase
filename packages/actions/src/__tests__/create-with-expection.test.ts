import { mockServer } from '@nocobase/test';

describe('create with exception', () => {
  it('should handle validationError', async () => {
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
          message: 'users.name cannot be null',
        },
      ],
    });
  });
});
