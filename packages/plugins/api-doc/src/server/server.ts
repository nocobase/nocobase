import { Plugin } from '@nocobase/server';
import send from 'koa-send';
import { resolve } from 'path';
import swagger from './swagger';

const API_DOC_PATH = '/api/_documentation';
export default class APIDoc extends Plugin {
  beforeLoad() {}

  generatePaths = () => {
    const names = this.app.resourcer.getResourcerNames();
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
      ...(options.accessors || {}),
    };

    const defaults = {
      single: {
        '/:resourceName': {
          get: accessors.list,
          post: accessors.create,
          delete: accessors.delete,
        },
        '/:resourceName/:resourceIndex': {
          get: accessors.get,
          put: accessors.update,
          patch: accessors.update,
          delete: accessors.delete,
        },
        '/:associatedName/:associatedIndex/:resourceName': {
          get: accessors.list,
          post: accessors.create,
          delete: accessors.delete,
        },
        '/:associatedName/:associatedIndex/:resourceName/:resourceIndex': {
          get: accessors.get,
          post: accessors.create,
          put: accessors.update,
          patch: accessors.update,
          delete: accessors.delete,
        },
      },
      hasOne: {
        '/:associatedName/:associatedIndex/:resourceName': {
          get: accessors.get,
          post: accessors.update,
          put: accessors.update,
          patch: accessors.update,
          delete: accessors.delete,
        },
      },
      hasMany: {
        '/:associatedName/:associatedIndex/:resourceName': {
          get: accessors.list,
          post: accessors.create,
          delete: accessors.delete,
        },
        '/:associatedName/:associatedIndex/:resourceName/:resourceIndex': {
          get: accessors.get,
          post: accessors.create,
          put: accessors.update,
          patch: accessors.update,
          delete: accessors.delete,
        },
      },
      belongsTo: {
        '/:associatedName/:associatedIndex/:resourceName': {
          get: accessors.get,
          delete: accessors.remove,
        },
        '/:associatedName/:associatedIndex/:resourceName/:resourceIndex': {
          post: accessors.set,
        },
      },
      belongsToMany: {
        '/:associatedName/:associatedIndex/:resourceName': {
          get: accessors.list,
          post: accessors.set,
        },
        '/:associatedName/:associatedIndex/:resourceName/:resourceIndex': {
          get: accessors.get,
          post: accessors.add,
          put: accessors.update, // Many to Many 的 update 是针对 through
          patch: accessors.update, // Many to Many 的 update 是针对 through
          delete: accessors.remove,
        },
      },
      set: {
        '/:associatedName/:associatedIndex/:resourceName': {
          get: accessors.list,
          post: accessors.add,
          delete: accessors.remove,
        },
      },
    };

    return names.reduce((paths, name) => {
      const actions = this.app.resourcer.getResource(name).actions;
      const pathsMethods = {};
      const currentPattern = defaults['single'];

      Array.from(actions.keys()).forEach((_actionName) => {
        let [resourceName, actionName] = _actionName.split(':');
        if (typeof actionName === 'undefined') {
          actionName = resourceName;
          resourceName = name;
        }
        pathsMethods[`/${resourceName}:${actionName}`] = {
          get: {
            tags: [resourceName],
            summary: `${resourceName} -> ${actionName}`,
            description: `The method power by ${resourceName}`,
          },
          post: {
            tags: [resourceName],
            summary: `${resourceName} -> ${actionName}`,
            description: `The method power by ${resourceName}`,
          },
        };
      });

      Object.entries(currentPattern).forEach(([matchPath, maps]) => {
        const currentPathMethods = {};
        Object.entries(maps).map(([method, actionName]) => {
          if (actions.has(actionName as string)) {
            currentPathMethods[method] = {
              tags: [name],
              summary: `${name} -> ${actionName}`,
              description: `The method power by ${name}`,
            };
          }
        });

        const pathName = matchPath.replace(':resourceName', name);
        if (!pathsMethods[pathName]) {
          pathsMethods[pathName] = {};
        }
        Object.assign(pathsMethods[pathName], currentPathMethods);
      });

      return {
        ...paths,
        ...pathsMethods,
      };
    }, {});
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
          servers: [
            {
              url: (this.app.resourcer.options.prefix || '/').replace(/^[^/]/, '/$1'),
            },
          ],
        };
        ctx.body = result;
      }

      if (ctx.path.startsWith('/api/test/data')) {
        ctx.withoutDataWrapping = true;
        ctx.set('Content-Type', 'application/json');

        ctx.body = this.generatePaths();
      }
      await next();
    });
  }
}
