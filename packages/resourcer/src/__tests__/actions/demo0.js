module.exports = async function (ctx, next) {
  ctx.arr.push(7);
  await next();
  ctx.arr.push(8);
};
