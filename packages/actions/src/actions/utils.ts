import { MultipleRelationRepository } from '@nocobase/database/src/relation-repository/multiple-relation-repository';
import { Repository } from '@nocobase/database/src/repository';
import { ActionParams } from '@nocobase/resourcer';
import { Context } from '..';

export function getRepositoryFromParams(ctx: Context) {
  const {
    resourceName,

    associatedName,
    associatedIndex,
  } = ctx.action.params;

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
