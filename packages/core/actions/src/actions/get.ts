import { Context } from '..';
import { getRepositoryFromParams } from '../utils';

export async function get(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);

  const { filterByTk, fields, appends, except, filter } = ctx.action.params;

  const instance = await repository.findOne({
    filterByTk,
    fields,
    appends,
    except,
    filter,
    context: ctx,
  });

  ctx.body = instance;

  await next();
}
