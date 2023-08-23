import { Collection } from '@nocobase/database';
import { getTypeByField } from './field-type-map';

export default (collection: Collection) => {
  const primaryKey = collection.model.primaryKeyAttribute;

  const parameters = {
    filterByTk: {
      name: 'filterByTk',
      in: 'query',
      description: 'filter by tk',
      schema: getTypeByField(collection.fields.get(primaryKey)),
    },
    collectionIndex: {
      required: true,
      name: 'collectionIndex',
      in: 'path',
      description: 'collection index',
      schema: getTypeByField(collection.fields.get(primaryKey)),
    },
    filter: {
      name: 'filter',
      in: 'query',
      description: 'filter items',
      schema: {
        type: 'object',
      },
    },
    sort: {
      name: 'sort',
      in: 'query',
      description: 'sort items by fields',
      schema: {
        oneOf: [
          {
            type: 'array',
            items: {
              type: 'string',
            },
            example: ['-id', 'createdAt'],
          },
          {
            type: 'string',
            example: '-id,createdAt',
          },
        ],
      },
    },
    fields: {
      name: 'fields',
      in: 'query',
      description: 'select fields',
      schema: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },

    except: {
      name: 'except',
      in: 'query',
      description: 'except fields in results',
      schema: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },

    appends: {
      name: 'appends',
      in: 'query',
      description: 'append associations in results',
      schema: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },

    whitelist: {
      name: 'whitelist',
      in: 'query',
      description: 'whitelist for fields changes',
      schema: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    blacklist: {
      name: 'blacklist',
      in: 'query',
      description: 'blacklist for fields changes',
      schema: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
  };

  return {
    parameters,
  };
};
