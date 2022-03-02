import { mockServer } from '@nocobase/test';

describe('error handle', () => {
  it('should handle error with default handler', async () => {
    const app = mockServer();

    app.use(async () => {
      throw new Error('some thing went wrong');
    });

    const response = await app.agent().post('/');

    expect(response.statusCode).toEqual(500);
    expect(response.body.errors[0].message).toEqual('some thing went wrong');
  });

  it('should handle error by custom handler', async () => {
    class CustomError extends Error {
      constructor(message, errors) {
        super(message);
        this.name = 'SequelizeValidationError';
        this.message = 'Validation Error';
      }
    }

    const app = mockServer();

    app.errorHandler.register(CustomError, (err, ctx) => {
      ctx.body = {
        message: 'hello',
      };
      ctx.status = 422;
    });

    app.use(async () => {
      throw new CustomError('some thing went wrong', []);
    });

    const response = await app.agent().post('/');

    expect(response.statusCode).toEqual(422);
    expect(response.body).toEqual({ message: 'hello' });
  });
});
