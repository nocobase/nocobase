import { merge } from '@nocobase/utils';
import ApiDocPlugin from '../server';
import baseSwagger from './base-swagger';
import { SchemaTypeMapping } from './constants';
import { createDefaultActionSwagger, getInterfaceCollection } from './helpers';
import { getSwaggerDocument } from './load';
export class SwaggerManager {
  private swagger: Record<string, any> = baseSwagger;
  private plugin: ApiDocPlugin;
  private get app() {
    return this.plugin.app;
  }
  private get db() {
    return this.plugin.db;
  }

  private get baseSwagger() {
    return Object.assign(baseSwagger, {
      servers: [
        {
          url: (this.app.resourcer.options.prefix || '/').replace(/^[^/]/, '/$1'),
        },
      ],
    });
  }

  constructor(plugin: ApiDocPlugin) {
    this.plugin = plugin;
    this.listenAppEvent();
  }

  private listenAppEvent() {
    const eventCallback = () => {
      this.generateSwagger();
    };
    this.app.on('afterLoad', eventCallback);
    this.app.on('afterReload', eventCallback);
    this.app.on('afterEnablePlugin', eventCallback);
    this.app.on('afterDisablePlugin', eventCallback);
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
      schemas[collection.name] = model;
    });
    return schemas;
  }

  private generateCollectionBuiltInInterface() {
    const paths = {};
    const IC = getInterfaceCollection(this.app.resourcer.options);
    this.db.collections.forEach((collection) => {
      const { name } = collection;
      if (!this.app.resourcer.isDefined(name)) {
        return;
      }

      const { actions } = this.app.resourcer.getResource(name);
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

  private loadSwaggers() {
    return getSwaggerDocument(this.db);
  }

  async generateSwagger() {
    const newSchemas = {
      paths: await this.generateCollectionBuiltInInterface(),
      components: {
        schemas: await this.generateSchemas(),
      },
    };
    this.swagger = merge(merge(this.baseSwagger, newSchemas), await this.loadSwaggers());
    return this.swagger;
  }

  getSwagger() {
    return this.swagger;
  }
}
