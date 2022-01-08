import { Context } from '..';
import { getRepositoryFromParams } from './utils';

export async function destroy(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);

  const { resourceIndex, filter } = ctx.action.params;

  const instance = await repository.destroy({
    filter,
    filterByTk: resourceIndex,
    context: ctx,
  });

  ctx.body = instance;
  await next();
}
