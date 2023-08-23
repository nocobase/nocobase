import { BelongsToManyField, Collection, HasManyField } from '@nocobase/database';
import {
  CreateActionTemplate,
  DestroyActionTemplate,
  GetActionTemplate,
  ListActionTemplate,
  UpdateActionTemplate,
} from '../collection';

export function appendCollectionIndexParams(apiDef: object) {
  for (const action of Object.keys(apiDef)) {
    const parameters = apiDef[action]['parameters'];

    if (!parameters) {
      apiDef[action]['parameters'] = [];
    }

    apiDef[action]['parameters'].unshift({
      $ref: '#/components/parameters/collectionIndex',
    });
  }
  return apiDef;
}

export default (collection: Collection, associationField: HasManyField | BelongsToManyField) => {
  return {
    [`/${collection.name}/{collectionIndex}/${associationField.name}:list`]: appendCollectionIndexParams(
      ListActionTemplate({
        collectionName: associationField.target,
        target: `${collection.name}.${associationField.name}`,
      }),
    ),
    [`/${collection.name}/{collectionIndex}/${associationField.name}:get`]: appendCollectionIndexParams(
      GetActionTemplate({
        collectionName: associationField.target,
        target: `${collection.name}.${associationField.name}`,
      }),
    ),
    [`/${collection.name}/{collectionIndex}/${associationField.name}:create`]: appendCollectionIndexParams(
      CreateActionTemplate({
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
    [`/${collection.name}/{collectionIndex}/${associationField.name}:destroy`]: appendCollectionIndexParams(
      DestroyActionTemplate({
        collectionName: associationField.target,
        target: `${collection.name}.${associationField.name}`,
      }),
    ),
  };
};
