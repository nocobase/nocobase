import { MultipleRelationRepository } from '@nocobase/database/src/relation-repository/multiple-relation-repository';
import { Repository } from '@nocobase/database/src/repository';
import { Context } from '..';
import { BelongsToManyRepository, HasManyRepository } from '@nocobase/database';

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
