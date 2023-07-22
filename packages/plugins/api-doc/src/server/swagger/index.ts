import { merge } from '@nocobase/utils';
import APIDocPlugin from '../server';
import baseSwagger from './base-swagger';
import { SchemaTypeMapping } from './constants';
import { createDefaultActionSwagger, getInterfaceCollection } from './helpers';
import { getSwaggerDocument, loadSwagger } from './load';
export class SwaggerManager {
  private plugin: APIDocPlugin;

  private get app() {
    return this.plugin.app;
  }
  private get db() {
    return this.plugin.db;
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

  constructor(plugin: APIDocPlugin) {
    this.plugin = plugin;
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

  async generateSwagger(options: { plugins?: string[] } = {}) {
    return merge(await this.getBaseSwagger(), await this.loadSwaggers(options.plugins));
  }

  async getSwagger() {
    return this.generateSwagger();
  }

  async getPluginsSwagger(pluginName?: string) {
    return this.generateSwagger({
      plugins: pluginName ? [pluginName] : undefined,
    });
  }

  async getCoreSwagger() {
    return merge(await this.getBaseSwagger(), await loadSwagger('@nocobase/server'));
  }

  async getUrls() {
    const plugins = await this.db
      .getRepository('applicationPlugins')
      .find({
        filter: {
          enabled: true,
        },
      })
      .then((res) => {
        return res.map((item) => {
          return {
            name: `NocoBase ${item.get('name')} plugin documentation`,
            url: `/api/swagger/plugins/${item.get('name')}/swagger.json`,
          };
        });
      })
      .catch(() => []);
    return [
      {
        name: 'NocoBase documentation',
        url: '/api/swagger/nocobase.json',
      },
      {
        name: 'NocoBase Core documentation',
        url: '/api/swagger/core/swagger.json',
      },
      {
        name: 'NocoBase Plugins documentation',
        url: '/api/plugins/swagger.json',
      },
      ...plugins,
    ];
  }
}
