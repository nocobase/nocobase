import { BelongsToField, Collection, HasOneField } from '@nocobase/database';
import { appendCollectionIndexParams } from './multiple-association';
import { DestroyActionTemplate, GetActionTemplate, UpdateActionTemplate } from '../collection';

function removeFilterByTkParams(apiDoc: object) {
  for (const action of Object.values(apiDoc)) {
    if (action.parameters) {
      action.parameters = action.parameters.filter((param: any) => {
        if (param.$ref) {
          return param.$ref !== '#/components/parameters/filterByTk';
        }
      });
    }
  }

  return apiDoc;
}

export default (collection: Collection, associationField: HasOneField | BelongsToField) => {
  const options = {
    collection,
    relationField: associationField,
  };

  return {
    [`/${collection.name}/{collectionIndex}/${associationField.name}:get`]: removeFilterByTkParams(
      appendCollectionIndexParams(GetActionTemplate(options)),
    ),
    [`/${collection.name}/{collectionIndex}/${associationField.name}:set`]: appendCollectionIndexParams({
      post: {
        tags: [`${collection.name}.${associationField.name}`],
        summary: 'Associate a record',
        parameters: [
          {
            name: 'tk',
            in: 'query',
            description: 'targetKey',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    }),

    [`/${collection.name}/{collectionIndex}/${associationField.name}:remove`]: appendCollectionIndexParams({
      post: {
        tags: [`${collection.name}.${associationField.name}`],
        summary: 'Disassociate the relationship record',
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    }),
    [`/${collection.name}/{collectionIndex}/${associationField.name}:update`]: removeFilterByTkParams(
      appendCollectionIndexParams(UpdateActionTemplate(options)),
    ),
    [`/${collection.name}/{collectionIndex}/${associationField.name}:create`]: removeFilterByTkParams(
      appendCollectionIndexParams(UpdateActionTemplate(options)),
    ),
    [`/${collection.name}/{collectionIndex}/${associationField.name}:destroy`]: removeFilterByTkParams(
      appendCollectionIndexParams(DestroyActionTemplate(options)),
    ),
  };
};
