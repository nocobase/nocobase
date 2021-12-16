import { Context } from '..';
import { getRepositoryFromParams } from './utils';
import { SingleRelationRepository } from '@nocobase/database';

export async function get(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);

  const { resourceIndex, fields, appends, except, filter } = ctx.action.params;

  const instance = await repository.findOne({
    filterByPk: resourceIndex,
    fields,
    appends,
    except,
    filter,
  });

  ctx.body = instance;
  await next();
}
