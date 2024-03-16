import APIDocPlugin from '../server';
import baseSwagger from './base-swagger';
import collectionToSwaggerObject from './collections';
import { SchemaTypeMapping } from './constants';
import { createDefaultActionSwagger, getInterfaceCollection } from './helpers';
import { getPluginsSwagger, getSwaggerDocument, loadSwagger } from './loader';
import { merge } from './merge';

export class SwaggerManager {
  private plugin: APIDocPlugin;

  constructor(plugin: APIDocPlugin) {
    this.plugin = plugin;
  }

  private get app() {
    return this.plugin.app;
  }

  private get db() {
    return this.plugin.db;
  }

  async generateSwagger(options: { plugins?: string[] } = {}) {
    const base = await this.getBaseSwagger();
    const core = options.plugins ? {} : await loadSwagger('@nocobase/server');
    const plugins = await this.loadSwaggers(options.plugins);
    return merge(merge(core, plugins), base);
  }

  async getSwagger() {
    return this.generateSwagger();
  }

  async collection2Swagger(collectionName: string, withAssociation = true) {
    const collection = this.db.getCollection(collectionName);
    return await (async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      return collectionToSwaggerObject(collection, {
        withAssociation,
      });
    })();
  }

  async getCollectionsSwagger(name?: string) {
    const base = await this.getBaseSwagger();
    let others = {};
    if (name) {
      const collectionSwagger = await this.collection2Swagger(name);
      others = merge(others, collectionSwagger);
    } else {
      const collections = await this.db.getRepository('collections').find({
        filter: {
          'name.$ne': ['roles', 'users'],
          'hidden.$isFalsy': true,
        },
      });

      for (const collection of collections) {
        if (collection.name === 'roles') {
          continue;
        }

        try {
          others = merge(others, await this.collection2Swagger(collection.name, false));
        } catch (e) {
          this.app.log.error(e);
        }
      }
    }
    return merge(base, others);
  }

  async getPluginsSwagger(pluginName?: string) {
    return this.generateSwagger({
      plugins: pluginName ? [pluginName] : [],
    });
  }

  async getCoreSwagger() {
    return merge(await this.getBaseSwagger(), await loadSwagger('@nocobase/server'));
  }

  getURL(pathname: string) {
    return process.env.API_BASE_PATH + pathname;
  }

  async getUrls() {
    const plugins = await getPluginsSwagger(this.db)
      .then((res) => {
        return Object.keys(res).map((name) => {
          const schema = res[name];
          return {
            name: schema.info?.title || name,
            url: this.getURL(`swagger:get?ns=${encodeURIComponent(`plugins/${name}`)}`),
          };
        });
      })
      .catch(() => []);
    const collections = await this.db.getRepository('collections').find({
      filter: {
        'name.$ne': ['roles', 'users'],
        'hidden.$isFalsy': true,
      },
    });
    return [
      {
        name: 'NocoBase API',
        url: this.getURL('swagger:get'),
      },
      {
        name: 'NocoBase API - Core',
        url: this.getURL('swagger:get?ns=core'),
      },
      {
        name: 'NocoBase API - All plugins',
        url: this.getURL('swagger:get?ns=plugins'),
      },
      {
        name: 'NocoBase API - Custom collections',
        url: this.getURL('swagger:get?ns=collections'),
      },
      ...plugins,
      ...collections.map((collection) => {
        return {
          name: `Collection API - ${collection.title}`,
          url: this.getURL(`swagger:get?ns=${encodeURIComponent('collections/' + collection.name)}`),
        };
      }),
    ];
  }

  private async getBaseSwagger() {
    return merge(baseSwagger, {
      info: {
        version: await this.app.version.get(),
      },
      servers: [
        {
          url: (this.app.resourcer.options.prefix || '/').replace(/^[^/]/, '/$1'),
        },
      ],
    });
  }

  private generateSchemas() {
    const schemas = {};
    this.app.i18n;
    this.db.collections.forEach((collection) => {
      const properties = {};
      const model = {
        type: 'object',
        properties,
      };

      collection.forEachField((field) => {
        const { type, target } = field;
        const property: Record<string, any> = {};
        if (type === 'hasMany' || type === 'belongsToMany') {
          property['type'] = 'array';
          property['items'] = {
            $ref: `#/components/schemas/${target}`,
          };
        } else if (type === 'belongsTo' || type === 'hasOne') {
          property['type'] = 'object';
          property['$ref'] = `#/components/schemas/${target}`;
        } else {
          property.type = SchemaTypeMapping[type] || type;
          if (property.type === 'array' && !property.items) {
            property.items = {
              type: 'object',
            };
          }
          property.example = field.get('defaultValue');
        }
        properties[field.name] = property;
      });
      schemas[collection.name] = model;
    });
    return schemas;
  }

  private generateCollectionBuiltInInterface() {
    const paths = {};
    const IC = getInterfaceCollection(this.app.resourcer.options);
    this.db.collections.forEach((collection) => {
      const { name } = collection;
      let actions;

      if (this.app.resourcer.isDefined(name)) {
        actions = this.app.resourcer.getResource(name).actions;
      } else {
        actions = {
          has: () => true,
        };
      }

      const collectionMethods = {};
      Object.entries(IC).forEach(([path, actionNames]) => {
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
  }

  private loadSwaggers(plugins: string[]) {
    return getSwaggerDocument(this.db, plugins);
  }
}
