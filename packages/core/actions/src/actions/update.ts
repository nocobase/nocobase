import { Context } from '..';
import { getRepositoryFromParams } from '../utils';

export async function update(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);
  const { forceUpdate, filterByTk, values, whitelist, blacklist, filter, updateAssociationValues } = ctx.action.params;

  ctx.body = await repository.update({
    filterByTk,
    values,
    whitelist,
    blacklist,
    filter,
    updateAssociationValues,
    context: ctx,
    forceUpdate,
  });

  await next();
}
