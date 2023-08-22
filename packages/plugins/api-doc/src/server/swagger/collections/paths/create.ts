import { Collection } from '@nocobase/database';

export default (collection: Collection) => {
  return {
    [`/${collection.name}:create`]: {
      post: {
        tags: [collection.name],
        description: `create ${collection.name}`,
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
  };
};
