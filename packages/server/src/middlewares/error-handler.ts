export function errorHandler() {
  return async function errorHandler(ctx, next) {
    try {
      await next();
    } catch (err) {
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
  };
}
