import { Context } from '..';
import { getRepositoryFromParams } from './utils';
import { SingleRelationRepository } from '@nocobase/database';

export async function get(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);

  const { fields, appends, except } = ctx.action.params;

  let callMethod;
  if (repository instanceof SingleRelationRepository) {
    callMethod = 'find';
  } else {
    callMethod = 'findOne';
  }

  const instance = await repository[callMethod]({
    filterByPk: ctx.action.params.resourceIndex,
    fields,
    appends,
    except,
  });

  ctx.body = instance;
  await next();
}
