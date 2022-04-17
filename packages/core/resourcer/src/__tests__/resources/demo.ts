export default {
  name: 'demo',
  actions: {
    async list(ctx, next) {
      ctx.arr.push(1);
      await next();
      ctx.arr.push(2);
    },
  },
};
