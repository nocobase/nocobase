import Application from './application';

export class ErrorHandler {
  registeredErrors = new Map();

  constructor(app: Application) {}

  register(error: any, render: (err, ctx) => void) {
    this.registeredErrors.set(error, render);
  }

  defaultHandler(err, ctx) {
    ctx.status = err.statusCode || err.status || 500;
    ctx.body = {
      errors: [
        {
          message: err.message,
          code: err.code,
        },
      ],
    };
  }

  middleware() {
    const self = this;

    return async function errorHandler(ctx, next) {
      try {
        await next();
      } catch (err) {
        const handler = self.registeredErrors.get(err.constructor);

        return handler ? handler(err, ctx) : self.defaultHandler(err, ctx);
      }
    };
  }
}
