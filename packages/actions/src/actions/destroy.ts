import { Context } from '..';
import { getRepositoryFromParams } from './utils';

export async function destroy(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);

  const instance = await repository.destroy({
    filterByPk: ctx.action.params.resourceIndex,
  });

  ctx.body = instance;
  await next();
}
