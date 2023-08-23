import { Collection } from '@nocobase/database';
import { associationFields } from '../paths/associations';
import { relationTypeToString } from '../paths/collection';

export default (collection: Collection) => {
  const associations = associationFields(collection);

  return [
    {
      name: collection.name,
      description: collection.options?.title || collection.name,
    },

    ...associations.map((field) => {
      return {
        name: `${collection.name}.${field.name}`,
        description: `${relationTypeToString(field)} relationship, ${collection.options?.title || collection.name}/${
          field.options?.uiSchema?.title || field.name
        }`,
      };
    }),
  ];
};
