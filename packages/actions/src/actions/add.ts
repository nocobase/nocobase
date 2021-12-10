import { Context } from '..';
import { getRepositoryFromParams } from './utils';
import { BelongsToManyRepository, MultipleRelationRepository } from '@nocobase/database';
import { HasManyRepository } from '@nocobase/database/src/relation-repository/hasmany-repository';

export default async function add(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);

  if (!(repository instanceof MultipleRelationRepository)) {
    return await next();
  }

  await (<HasManyRepository | BelongsToManyRepository>repository).add(ctx.action.params.values);
  await next();
}
