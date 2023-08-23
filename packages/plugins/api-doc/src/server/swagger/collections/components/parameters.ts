import { Collection } from '@nocobase/database';
import { getTypeByField } from './field-type-map';

export default (collection: Collection) => {
  const primaryKey = collection.model.primaryKeyAttribute;

  const parameters = {};

  if (primaryKey) {
    Object.assign(parameters, {
      collectionIndex: {
        required: true,
        name: 'collectionIndex',
        in: 'path',
        description: 'collection index',
        schema: getTypeByField(collection.fields.get(primaryKey)),
      },
      filterByTk: {
        name: 'filterByTk',
        in: 'query',
        description: 'filter by TK(default by ID)',
        schema: getTypeByField(collection.fields.get(primaryKey)),
      },

      filterByTks: {
        name: 'filterByTk',
        in: 'query',
        description: 'filter by TKs(default by ID), example: `1,2,3`',
        schema: {
          type: 'array',
          items: getTypeByField(collection.fields.get(primaryKey)),
        },
      },
    });
  }

  Object.assign(parameters, {
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
  });

  return {
    parameters,
  };
};
