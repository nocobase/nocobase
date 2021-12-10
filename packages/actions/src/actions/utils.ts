import { MultipleRelationRepository, Repository } from '@nocobase/database';
import { Context } from '..';

export function getRepositoryFromParams(ctx: Context) {
  const { resourceName, associatedName, associatedIndex } = ctx.action.params;

  let repository: MultipleRelationRepository | Repository;

  if (associatedName) {
    repository = <MultipleRelationRepository>(
      ctx.db.getCollection(associatedName).repository.relation(resourceName).of(associatedIndex)
    );
  } else {
    repository = <Repository>ctx.db.getCollection(resourceName).repository;
  }

  return repository;
}

export function RelationRepositoryActionBuilder(method: 'remove' | 'set') {
  return async function (ctx: Context, next) {
    const repository = getRepositoryFromParams(ctx);

    await repository[method](ctx.action.params.values);
    await next();
  };
}
