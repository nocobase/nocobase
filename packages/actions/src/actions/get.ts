import { Context } from '..';
import { getRepositoryFromParams } from './utils';

export async function get(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);

  const { resourceIndex, fields, appends, except, filter } = ctx.action.params;

  const instance = await repository.findOne({
    filterByTk: resourceIndex,
    fields,
    appends,
    except,
    filter,
  });

  ctx.body = instance;
  await next();
}
