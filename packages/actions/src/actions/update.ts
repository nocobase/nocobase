import { Context } from '..';
import { getRepositoryFromParams } from './utils';

export async function update(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);
  const { resourceIndex, values, whitelist, blacklist, filter, updateAssociationValues } = ctx.action.params;

  const instance = await repository.update({
    filterByPk: resourceIndex,
    values,
    whitelist,
    blacklist,
    filter,
    updateAssociationValues,
    context: ctx,
  });

  ctx.body = instance;
  await next();
}
