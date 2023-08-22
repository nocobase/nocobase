import { BelongsToField, Collection, HasOneField } from '@nocobase/database';
import { appendCollectionIndexParams } from './multiple-association';
import { GetActionTemplate, UpdateActionTemplate } from '../list';

export default (collection: Collection, associationField: HasOneField | BelongsToField) => {
  return {
    [`/${collection.name}/{collectionIndex}/${associationField.name}:get`]: appendCollectionIndexParams(
      GetActionTemplate({
        collectionName: associationField.target,
        target: `${collection.name}.${associationField.name}`,
      }),
    ),
    [`/${collection.name}/{collectionIndex}/${associationField.name}:update`]: appendCollectionIndexParams(
      UpdateActionTemplate({
        collectionName: associationField.target,
        target: `${collection.name}.${associationField.name}`,
      }),
    ),
  };
};
