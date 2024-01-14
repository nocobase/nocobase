export function AclSelectorMiddleware() {
  return async (ctx, next) => {
    const databaseName = ctx.get('x-database');
    const aclInstance = databaseName ? ctx.app.acls.get(databaseName) : ctx.app.acl;

    const middleware = aclInstance.middleware();
    await middleware(ctx, next);
  };
}
