import { Collection, RelationField } from '@nocobase/database';
import { hasSortField, readOnlyCollection } from './index';

type TemplateOptions = {
  collection: Collection;
  relationField?: RelationField;
};

export function relationTypeToString(field: RelationField) {
  return {
    belongsTo: 'Many to one',
    hasOne: 'One to one',
    hasMany: 'One to many',
    belongsToMany: 'Many to many',
  }[field.type];
}

export function ListActionTemplate({ collection, relationField }: TemplateOptions) {
  return {
    get: {
      tags: [relationField ? `${collection.name}.${relationField.name}` : collection.name],
      summary: relationField
        ? `Return a list of ${relationTypeToString(relationField)} relationship`
        : `Returns a list of the collection`,
      parameters: [
        {
          name: 'page',
          in: 'query',
          description: 'page number',
          required: false,
          schema: {
            type: 'integer',
          },
        },
        {
          name: 'pageSize',
          in: 'query',
          description: 'page size',
          required: false,
          schema: {
            type: 'integer',
          },
        },
        {
          $ref: '#/components/parameters/filter',
        },
        {
          $ref: '#/components/parameters/sort',
        },
        {
          $ref: '#/components/parameters/fields',
        },
        {
          $ref: '#/components/parameters/appends',
        },
        {
          $ref: '#/components/parameters/except',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      $ref: `#/components/schemas/${collection.name}`,
                    },
                  },
                  meta: {
                    type: 'object',
                    properties: {
                      count: {
                        type: 'integer',
                        description: 'total count',
                      },
                      page: {
                        type: 'integer',
                        description: 'current page',
                      },
                      pageSize: {
                        type: 'integer',
                        description: 'items count per page',
                      },
                      totalPage: {
                        type: 'integer',
                        description: 'total page',
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

export function GetActionTemplate(options: TemplateOptions) {
  const { collection, relationField } = options;

  return {
    get: {
      tags: [relationField ? `${collection.name}.${relationField.name}` : collection.name],
      summary: `Return a record${relationField ? ` of ${relationTypeToString(relationField)}` : ''}`,
      parameters: [
        {
          $ref: '#/components/parameters/filterByTk',
        },
        {
          $ref: '#/components/parameters/filter',
        },
        {
          $ref: '#/components/parameters/sort',
        },
        {
          $ref: '#/components/parameters/fields',
        },
        {
          $ref: '#/components/parameters/appends',
        },
        {
          $ref: '#/components/parameters/except',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    $ref: `#/components/schemas/${collection.name}`,
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

export function CreateActionTemplate(options: TemplateOptions) {
  const { collection, relationField } = options;
  return {
    post: {
      tags: [relationField ? `${collection.name}.${relationField.name}` : collection.name],
      summary: relationField ? `Create and associate a record` : `Create record`,
      parameters: [
        {
          $ref: '#/components/parameters/whitelist',
        },
        {
          $ref: '#/components/parameters/blacklist',
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
                type: 'object',
                properties: {
                  data: {
                    $ref: `#/components/schemas/${collection.name}`,
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

export function UpdateActionTemplate(options: TemplateOptions) {
  const { collection, relationField } = options;
  return {
    post: {
      tags: [relationField ? `${collection.name}.${relationField.name}` : collection.name],
      summary: relationField ? `Update the relationship record` : `Update record`,
      parameters: [
        {
          $ref: '#/components/parameters/filterByTk',
        },
        {
          $ref: '#/components/parameters/filter',
        },
        {
          $ref: '#/components/parameters/whitelist',
        },
        {
          $ref: '#/components/parameters/blacklist',
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
                type: 'object',
                properties: {
                  data: {
                    $ref: `#/components/schemas/${collection.name}`,
                  },
                },
              },
            },
          },
        },
      },
    },
  };
}

export function DestroyActionTemplate(options: TemplateOptions) {
  const { collection, relationField } = options;
  return {
    post: {
      tags: [relationField ? `${collection.name}.${relationField.name}` : collection.name],
      summary: relationField ? `Destroy and disassociate the relationship record` : `Delete record`,
      parameters: [
        {
          $ref: '#/components/parameters/filterByTk',
        },
        {
          $ref: '#/components/parameters/filter',
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  };
}

export function MoveActionTemplate(options: TemplateOptions) {
  const { collection, relationField } = options;

  return {
    post: {
      tags: [relationField ? `${collection.name}.${relationField.name}` : collection.name],
      summary: relationField ? `Move the relationship record` : `Move record`,
      parameters: [
        {
          name: 'sourceId',
          in: 'query',
          description: 'source id',
          schema: { type: 'string' },
        },
        {
          name: 'targetId',
          in: 'query',
          description: 'move target id',
          schema: { type: 'string' },
        },

        {
          name: 'method',
          in: 'query',
          description: 'move method, insertAfter or insertBefore',
          schema: { type: 'string' },
        },
        {
          name: 'sortField',
          in: 'query',
          description: 'sort field name, default is sort',
          schema: { type: 'string' },
        },
        {
          name: 'targetScope',
          in: 'query',
          description: 'move target scope',
          schema: { type: 'string' },
        },
        {
          name: 'sticky',
          in: 'query',
          description: 'sticky to top',
          schema: { type: 'boolean' },
        },
      ],
      responses: {
        '200': {
          description: 'OK',
        },
      },
    },
  };
}

export default (collection: Collection) => {
  const options = { collection };
  const apiDoc: any = {
    [`/${collection.name}:list`]: ListActionTemplate(options),
    [`/${collection.name}:get`]: GetActionTemplate(options),
  };

  if (!readOnlyCollection(collection)) {
    Object.assign(apiDoc, {
      [`/${collection.name}:create`]: CreateActionTemplate(options),
      [`/${collection.name}:update`]: UpdateActionTemplate(options),
      [`/${collection.name}:destroy`]: DestroyActionTemplate(options),
    });
  }

  if (hasSortField(collection)) {
    apiDoc[`/${collection.name}:move`] = MoveActionTemplate(options);
  }

  return apiDoc;
};
