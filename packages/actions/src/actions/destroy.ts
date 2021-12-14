import { Context } from '..';
import { getRepositoryFromParams } from './utils';

export async function destroy(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);

  const { filter } = ctx.action.params;

  const instance = await repository.destroy({
    filter,
    filterByPk: ctx.action.params.resourceIndex,
    context: ctx,
  });

  ctx.body = instance;
  await next();
}
