import { Plugin } from '@nocobase/server';
import send from 'koa-send';
import { resolve } from 'path';
import swagger from './swagger';

const SchemaTypeMapping = {
  uid: 'string',
  json: 'object',
  jsonb: 'object',
  text: 'string',
  bigInt: 'integer',
  sort: 'integer',
  content: 'string',
};

const createDefaultActionSwagger = ({ collection }) => {
  const responses = {
    default: {
      content: {
        'application/json': {
          schema: {
            $ref: `#/components/schemas/${collection.name}`,
          },
        },
      },
    },
  };
  const requestBody = {
    content: {
      'application/json': {
        schema: {
          $ref: `#/components/schemas/${collection.name}`,
        },
      },
    },
  };
  return {
    list: {
      method: 'get',
      responses,
    },
    create: {
      method: 'post',
      requestBody,
    },
    get: {
      method: 'get',
      responses,
    },
    update: {
      method: 'put',
      requestBody,
      responses,
    },
    destroy: {
      method: 'delete',
      responses,
    },
    add: {
      method: 'post',
      requestBody,
      responses,
    },
    set: {
      method: 'post',
      requestBody,
    },
    remove: {
      method: 'delete',
      responses,
    },
    toggle: {
      method: 'post',
      requestBody,
      responses,
    },
    move: {
      method: 'post',
      requestBody,
    },
  };
};

const API_DOC_PATH = '/api/_documentation';

export default class APIDoc extends Plugin {
  beforeLoad() {}

  generateModels = () => {
    const models = {};
    this.db.collections.forEach((collection) => {
      const properties = {};
      const model = {
        type: 'object',
        properties,
      };

      collection.forEachField((field) => {
        const property: Record<string, any> = {};
        if (field.type === 'array') {
          property['items'] = {
            type: 'object',
          };
        } else if (field.type === 'hasMany' || field.type === 'belongsToMany') {
          property['type'] = 'array';
          property['items'] = {
            $ref: `#/components/schemas/${field.target}`,
          };
        } else if (field.type === 'belongsTo' || field.type === 'hasOne') {
          property['type'] = 'object';
          property['$ref'] = `#/components/schemas/${field.target}`;
        } else {
          property.type = SchemaTypeMapping[field.type] || field.type;
        }
        properties[field.name] = property;
      });
      models[collection.name] = model;
    });
    return models;
  };

  generatePaths = () => {
    const options = this.app.resourcer.options;
    const accessors = {
      // 常规 actions
      list: 'list',
      create: 'create',
      get: 'get',
      update: 'update',
      delete: 'destroy',
      // associate 操作
      add: 'add',
      set: 'set',
      remove: 'remove',
      toggle: 'toggle',
      move: 'move',
      ...(options.accessors || {}),
    };

    const single = {
      '/{resourceName}': [accessors.list, accessors.create, accessors.delete],
      '/{resourceName}/{resourceIndex}': [accessors.get, accessors.update, accessors.delete],
      '/{associatedName}/{associatedIndex}/{resourceName}': [
        accessors.list,
        accessors.create,
        accessors.delete,
        accessors.toggle,
        accessors.add,
        accessors.remove,
      ],
      '/{associatedName}/{associatedIndex}/{resourceName}/{resourceIndex}': [
        accessors.get,
        accessors.update,
        accessors.delete,
        accessors.remove,
        accessors.toggle,
        accessors.set,
        accessors.move,
      ],
    };

    const paths = {};
    this.db.collections.forEach((collection) => {
      const { name } = collection;
      if (!this.app.resourcer.isDefined(name)) {
        return;
      }

      const { actions } = this.app.resourcer.getResource(name);
      const collectionMethods = {};
      Object.entries(single).forEach(([path, actionNames]) => {
        actionNames.forEach((actionName) => {
          const actionMethods = createDefaultActionSwagger({
            collection,
          });
          const { method = 'post', ...swaggerArgs } = actionMethods[actionName];
          const parameters = [];
          ['associatedName', 'associatedIndex', 'resourceIndex'].forEach((name) => {
            if (path.includes(`{${name}}`)) {
              parameters.push({
                name,
                required: true,
                schema: {
                  type: 'string',
                },
              });
            }
          });

          if (actions.has(actionName)) {
            collectionMethods[path.replace('{resourceName}', `${name}:${actionName}`)] = {
              [method]: {
                tags: [name],
                description: `${name}:${actionName}`,
                parameters,
                ...swaggerArgs,
              },
            };
          }
        });
      });
      Object.assign(paths, collectionMethods);
    });
    return paths;
  };

  async load() {
    this.app.use(async (ctx, next) => {
      console.log(ctx.path);
      if (ctx.path.startsWith(API_DOC_PATH)) {
        const root = resolve(process.cwd(), './node_modules/swagger-ui-dist');
        const filename = ctx.path.replace(API_DOC_PATH, '');
        if (!filename || filename === '/') {
          return send(ctx, 'index.html', { root: __dirname });
        }
        return send(ctx, filename, { root });
      }
      if (ctx.path.startsWith('/api/swagger.json')) {
        ctx.withoutDataWrapping = true;
        const result = {
          ...swagger,
          paths: this.generatePaths(),
          components: {
            ...swagger.components,
            schemas: this.generateModels(),
          },
          servers: [
            {
              url: (this.app.resourcer.options.prefix || '/').replace(/^[^/]/, '/$1'),
            },
          ],
        };
        ctx.body = result;
      }
      await next();
    });
  }
}
