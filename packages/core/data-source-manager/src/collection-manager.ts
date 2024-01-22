export class CollectionManager {
  defineCollection(options) {}
  extendCollection(options) {}
  middleware() {
    return async (ctx, next) => {
      // TODO: Collection to Resource
      await next();
    };
  }
}
