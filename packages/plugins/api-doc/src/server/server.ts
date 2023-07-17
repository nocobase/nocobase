import { Plugin } from '@nocobase/server';
import send from 'koa-send';
import { resolve } from 'path';
import swagger from './swagger';

const ACTIONS_METHODS = {
  list: 'get',
  create: 'post',
  get: 'get',
  update: 'put',
  destroy: 'delete',
  add: 'post',
  set: 'post',
  remove: 'delete',
  toggle: 'post',
  move: 'put',
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
        properties[field.name] = {
          type: field.type,
        };
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

    // console.log(Array.from(this.app.values()));
    const paths = {};
    this.db.collections.forEach(({ name }) => {
      if (!this.app.resourcer.isDefined(name)) {
        return;
      }

      const { actions } = this.app.resourcer.getResource(name);
      const collectionMethods = {};
      Object.entries(single).forEach(([path, actionNames]) => {
        actionNames.forEach((actionName) => {
          const method = ACTIONS_METHODS[actionName] || 'post';
          const parameters = [];
          if (path.includes('{associatedName}')) {
            parameters.push({
              name: 'associatedName',
              required: true,
              schema: {
                type: 'string',
              },
            });
          }
          if (path.includes('{associatedIndex}')) {
            parameters.push({
              name: 'associatedIndex',
              required: true,
              schema: {
                type: 'string',
              },
            });
          }
          if (path.includes('{resourceIndex}')) {
            parameters.push({
              name: 'resourceIndex',
              required: true,
              schema: {
                type: 'string',
              },
            });
          }

          if (actions.has(actionName)) {
            collectionMethods[path.replace('{resourceName}', `${name}:${actionName}`)] = {
              [method]: {
                tags: [name],
                description: `${name}:${actionName}`,
                parameters,
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
