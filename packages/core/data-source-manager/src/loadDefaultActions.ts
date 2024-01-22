import { type DataSource } from './DataSource';

export function loadDefaultActions(dataSource: DataSource) {
  return {
    async create(ctx, next) {
      const { whitelist, blacklist, updateAssociationValues, values } = ctx.action.params;
      console.log('values', values, ctx.request.body);
      const repository = ctx.getCurrentRepository();
      const instance = await repository.create({ values, whitelist, blacklist, updateAssociationValues, context: ctx });
      ctx.body = instance;
      await next();
    },
  };
}
