import { Collection } from '@nocobase/database';
import { getTypeByField } from './field-type-map';

export default (collection: Collection) => {
  const primaryKey = collection.model.primaryKeyAttribute;

  return {
    parameters: {
      filterByTk: {
        name: 'filterByTk',
        in: 'query',
        description: 'filter by tk',
        schema: getTypeByField(collection.fields.get(primaryKey)),
      },
    },
  };
};
