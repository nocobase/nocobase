import { getRepositoryFromParams } from './utils';
import { BelongsToManyRepository, MultipleRelationRepository, HasManyRepository } from '@nocobase/database';
import { Context } from '@nocobase/actions';

export default async function set(ctx: Context, next) {
  const repository = getRepositoryFromParams(ctx);

  if (!(repository instanceof MultipleRelationRepository)) {
    return await next();
  }

  await (<HasManyRepository | BelongsToManyRepository>repository).set(ctx.action.params.values);
  await next();
}
