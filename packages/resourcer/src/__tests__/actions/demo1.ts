export default async function (ctx, next) {
  ctx.arr.push(9);
  await next();
  ctx.arr.push(10);
}
