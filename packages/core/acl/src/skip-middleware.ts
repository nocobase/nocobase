export const skip = (options: ACLSkipOptions) => {
  return async function ACLSkipMiddleware(ctx, next) {
    const { resourceName, actionName } = ctx.action;
    if (resourceName === options.resourceName && actionName === options.actionName) {
      ctx.permission = {
        skip: true,
      };
    }
    await next();
  };
};

interface ACLSkipOptions {
  resourceName: string;
  actionName: string;
}
