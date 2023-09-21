import { BelongsToManyField, Collection, HasManyField } from '@nocobase/database';
import {
  CreateActionTemplate,
  DestroyActionTemplate,
  GetActionTemplate,
  ListActionTemplate,
  MoveActionTemplate,
  UpdateActionTemplate,
} from '../collection';
import { hasSortField } from '../index';

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

  const targetCollection = collection.db.getCollection(relationField.target);

  const paths = {
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

    [`/${collection.name}/{collectionIndex}/${relationField.name}:set`]: appendCollectionIndexParams({
      post: {
        tags: [`${collection.name}.${relationField.name}`],
        summary: 'Set or reset associations',
        parameters: [
          {
            $ref: '#/components/parameters/filterByTk',
          },
          {
            $ref: '#/components/parameters/filterByTks',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    }),

    [`/${collection.name}/{collectionIndex}/${relationField.name}:remove`]: appendCollectionIndexParams({
      post: {
        tags: [`${collection.name}.${relationField.name}`],
        summary: 'Detach record',
        parameters: [
          {
            $ref: '#/components/parameters/filterByTk',
          },
          {
            $ref: '#/components/parameters/filterByTks',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    }),

    [`/${collection.name}/{collectionIndex}/${relationField.name}:toggle`]: appendCollectionIndexParams({
      post: {
        tags: [`${collection.name}.${relationField.name}`],
        summary: 'Attach or detach record',
        parameters: [
          {
            $ref: '#/components/parameters/filterByTk',
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    }),
  };

  if (hasSortField(collection)) {
    paths[`/${collection.name}/{collectionIndex}/${relationField.name}:move`] = appendCollectionIndexParams(
      MoveActionTemplate(options),
    );
  }

  return paths;
};
