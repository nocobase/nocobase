import { Context } from '..';
import { getRepositoryFromParams } from './utils';

export async function create(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);
  const { whitelist, blacklist, updateAssociationValues } = ctx.action.params;

  const instance = await repository.create({
    values: ctx.action.params.values,
    whitelist,
    blacklist,
    updateAssociationValues,
    context: ctx,
  });

  ctx.body = instance;

  await next();
}
