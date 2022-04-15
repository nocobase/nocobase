export default async function (ctx, next) {
  ctx.arr.push(2);
  await next();
  ctx.arr.push(3);
}
