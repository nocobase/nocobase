import { mockServer } from '@nocobase/test';

describe('error handle', () => {
  it('should handle error', async () => {
    const app = mockServer();
    app.use(async () => {
      throw new Error('some thing went wrong');
    });

    const response = await app.agent().post('/');

    expect(response.statusCode).toEqual(500);
    expect(response.body.errors[0].message).toEqual('some thing went wrong');
  });
});
