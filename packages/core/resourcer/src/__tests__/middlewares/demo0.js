export default async function (ctx, next) {
  ctx.arr.push(1);
  await next();
  ctx.arr.push(2);
}
