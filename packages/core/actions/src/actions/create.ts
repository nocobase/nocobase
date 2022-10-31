import { Context } from '..';
import { getRepositoryFromParams } from '../utils';

export async function create(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);
  const { whitelist, blacklist, updateAssociationValues, values } = ctx.action.params;

  const instance = await repository.create({
    values,
    whitelist,
    blacklist,
    updateAssociationValues,
    context: ctx,
  });

  ctx.body = instance;
  await next();
}
