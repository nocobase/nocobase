import actions, { Context } from '@nocobase/actions';

import { getRepositoryFromParams } from './utils';

const databaseMoveAction = actions.move;

export async function move(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);

  if (repository.move) {
    ctx.body = await repository.move(ctx.action.params);
    await next();
    return;
  }

  if (repository.database) {
    ctx.databaseRepository = repository;
    return databaseMoveAction(ctx, next);
  }

  throw new Error(`Repository can not handle action move for ${ctx.action.resourceName}`);
}
