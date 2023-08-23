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

export default (collection: Collection, relationField: HasManyField | BelongsToManyField) => {
  const options = {
    collection,
    relationField,
  };

  return {
    [`/${collection.name}/{collectionIndex}/${relationField.name}:list`]: appendCollectionIndexParams(
      ListActionTemplate(options),
    ),
    [`/${collection.name}/{collectionIndex}/${relationField.name}:get`]: appendCollectionIndexParams(
      GetActionTemplate(options),
    ),
    [`/${collection.name}/{collectionIndex}/${relationField.name}:create`]: appendCollectionIndexParams(
      CreateActionTemplate(options),
    ),
    [`/${collection.name}/{collectionIndex}/${relationField.name}:update`]: appendCollectionIndexParams(
      UpdateActionTemplate(options),
    ),
    [`/${collection.name}/{collectionIndex}/${relationField.name}:destroy`]: appendCollectionIndexParams(
      DestroyActionTemplate(options),
    ),
  };
};
