import { BelongsToField, Collection, HasOneField } from '@nocobase/database';
import { appendCollectionIndexParams } from './multiple-association';
import { CreateActionTemplate, DestroyActionTemplate, GetActionTemplate, UpdateActionTemplate } from '../collection';

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

const parametersShouldRemove = [
  '#/components/parameters/filterByTk',
  '#/components/parameters/filter',
  '#/components/parameters/sort',
];

function filterSingleAssociationParams(apiDoc: object) {
  for (const action of Object.values(apiDoc)) {
    if (action.parameters) {
      action.parameters = action.parameters.filter((param: any) => {
        if (param.$ref) {
          return !parametersShouldRemove.includes(param.$ref);
        }
      });
    }
  }

  return apiDoc;
}

export default (collection: Collection, relationField: HasOneField | BelongsToField) => {
  const options = {
    collection,
    relationField,
  };

  return {
    [`/${collection.name}/{collectionIndex}/${relationField.name}:get`]: removeFilterByTkParams(
      filterSingleAssociationParams(appendCollectionIndexParams(GetActionTemplate(options))),
    ),
    [`/${collection.name}/{collectionIndex}/${relationField.name}:set`]: appendCollectionIndexParams({
      post: {
        tags: [`${collection.name}.${relationField.name}`],
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

    [`/${collection.name}/{collectionIndex}/${relationField.name}:remove`]: appendCollectionIndexParams({
      post: {
        tags: [`${collection.name}.${relationField.name}`],
        summary: 'Disassociate the relationship record',
        responses: {
          '200': {
            description: 'OK',
          },
        },
      },
    }),
    [`/${collection.name}/{collectionIndex}/${relationField.name}:update`]: removeFilterByTkParams(
      filterSingleAssociationParams(appendCollectionIndexParams(UpdateActionTemplate(options))),
    ),
    [`/${collection.name}/{collectionIndex}/${relationField.name}:create`]: removeFilterByTkParams(
      filterSingleAssociationParams(appendCollectionIndexParams(CreateActionTemplate(options))),
    ),
    [`/${collection.name}/{collectionIndex}/${relationField.name}:destroy`]: removeFilterByTkParams(
      filterSingleAssociationParams(appendCollectionIndexParams(DestroyActionTemplate(options))),
    ),
  };
};
