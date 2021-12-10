import { Context } from '..';
import { getRepositoryFromParams } from './utils';
import { BelongsToManyRepository } from '@nocobase/database';

export default async function add(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);

  if (!(repository instanceof BelongsToManyRepository)) {
    return await next();
  }

  await (<BelongsToManyRepository>repository).toggle(ctx.action.params.values);
  await next();
}
