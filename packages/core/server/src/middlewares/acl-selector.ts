export function AclSelectorMiddleware() {
  return async (ctx, next) => {
    const connectionName = ctx.get('x-connection');
    if (connectionName) {
      await next();
    } else {
      const aclInstance = connectionName ? ctx.app.acls.get(connectionName) : ctx.app.acl;

      const middleware = aclInstance.middleware();
      await middleware(ctx, next);
    }
  };
}
