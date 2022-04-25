type Context = any;
export type Merger = (ctx: Context) => object;

export type ActionPath = string;

export default class ParamsMergerManager {
  merger = new Map<ActionPath, Array<Merger>>();

  addMerger(path: ActionPath, merger: Merger) {
    this.merger.set(path, [...this.getMerger(path), merger]);
  }

  getMerger(path: ActionPath) {
    return this.merger.get(path) || [];
  }

  middleware() {
    return async (ctx, next) => {
      const { resourceName, actionName } = ctx.action.params;
      const actionPath = `${resourceName}:${actionName}`;

      const mergers = this.getMerger(actionPath);
      for (const merger of mergers) {
        ctx.action.mergeParams(merger(ctx));
      }

      await next();
    };
  }
}
