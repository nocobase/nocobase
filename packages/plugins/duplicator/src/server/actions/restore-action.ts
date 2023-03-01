export default async function restoreAction(ctx, next) {
  const { restoreKey, selectedOptionalGroups, selectedUserCollections } = ctx.request.body;

  await next();
}
