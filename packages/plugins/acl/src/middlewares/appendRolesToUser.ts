export async function appendRolesToUser(ctx, next) {
  ctx.state.currentUserAppends = ctx.state.currentUserAppends || [];
  ctx.state.currentUserAppends.push('roles');
  await next();
}
