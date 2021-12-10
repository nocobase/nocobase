import { Context } from '..';
import { getRepositoryFromParams } from './utils';

export default async function update(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);

  const instance = await repository.update({
    filterByPk: ctx.action.params.resourceIndex,
    values: ctx.action.params.values,
  });

  ctx.body = instance;
  await next();
}
