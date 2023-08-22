import { Collection } from '@nocobase/database';

export default (collection: Collection) => {
  return {
    [`/${collection.name}:update`]: {
      post: {
        tags: [collection.name],
        description: `update ${collection.name}`,
        parameters: [
          {
            $ref: '#/components/parameters/filterByTk',
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/${collection.name}.form`,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': {
                schema: {
                  $ref: `#/components/schemas/${collection.name}`,
                },
              },
            },
          },
        },
      },
    },
    [`/${collection.name}:destroy`]: {
      post: {
        tags: [collection.name],
        description: `destroy ${collection.name}`,
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
    },
  };
};
