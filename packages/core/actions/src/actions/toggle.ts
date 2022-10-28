import { BelongsToManyRepository } from '@nocobase/database';
import { Context } from '..';
import { getRepositoryFromParams } from '../utils';

export async function toggle(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);

  if (!(repository instanceof BelongsToManyRepository)) {
    return await next();
  }

  await (<BelongsToManyRepository>repository).toggle(ctx.action.params.values);
  ctx.body = 'ok';
  await next();
}
