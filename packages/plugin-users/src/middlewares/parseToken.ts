// TODO(feature): 表名应在 options 中配置
// 中间件默认只解决解析 token 和附加对应 user 的工作，不解决是否提前报 401 退出。
// 因为是否提供匿名访问资源是应用决定的，不是使用插件就一定不能匿名访问。
export default function (options) {
  return async (ctx, next) => {
    const token = ctx.get('Authorization').replace(/^Bearer\s+/gi, '');
    const User = ctx.db.getModel('users');
    const user = await User.findOne({
      where: {
        token,
      },
    });
    if (user) {
      ctx.state.currentUser = user;
    }

    return next();
  };
}
