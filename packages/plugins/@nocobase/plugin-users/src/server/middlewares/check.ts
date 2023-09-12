// TODO(usage): 拦截用户的处理暂时作为一个中间件导出，应用需要的时候可以直接使用这个中间件
export function check(options) {
  return async function check(ctx, next) {
    const { currentUser } = ctx.state;

    if (!currentUser) {
      return ctx.throw(401, 'Unauthorized');
    }
    return next();
  };
}
