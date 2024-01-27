import { type DataSource } from './data-source';
import { list } from './default-actions/list';
import { get } from './default-actions/get';
import { update } from './default-actions/update';
import { destroy } from './default-actions/destroy';

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

    list,
    get,
    update,
    destroy,
  };
}
