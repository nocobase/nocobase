import { Context } from '..';
import { getRepositoryFromParams } from './utils';
import { BelongsToManyRepository, MultipleRelationRepository, HasManyRepository } from '@nocobase/database';

export async function add(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);

  if (!(repository instanceof MultipleRelationRepository)) {
    return await next();
  }

  await (<HasManyRepository | BelongsToManyRepository>repository).add(ctx.action.params.values);
  await next();
}
