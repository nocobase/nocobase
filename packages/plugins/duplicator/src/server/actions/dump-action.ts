export default async function dumpAction(ctx, next) {
  console.log(ctx.request.body);
  await next();
}
