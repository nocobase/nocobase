import { Application, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { Database } from '@nocobase/database';
import remoteCollectionsResourcer from './resourcers/data-sources-collections';
import remoteFieldsResourcer from './resourcers/data-sources-collections-fields';
import { DataSourcesCollectionModel } from './models/data-sources-collection-model';
import { DataSourcesFieldModel } from './models/data-sources-field-model';
import { rolesRemoteCollectionsResourcer } from './resourcers/roles-data-sources-collections';
import databaseConnectionsRolesResourcer from './resourcers/data-sources-roles';
import rolesConnectionResourcesResourcer from './resourcers/data-sources-resources';

import { DataSourcesRolesModel } from './models/data-sources-roles-model';
import { DataSourcesRolesResourcesModel } from './models/connections-roles-resources';
import { DataSourcesRolesResourcesActionModel } from './models/connections-roles-resources-action';
import { Middleware } from '@nocobase/resourcer';
import { DataSourceModel } from './models/data-source';

export class PluginDataSourceManagerServer extends Plugin {
  async beforeLoad() {
    this.app.db.registerModels({
      DataSourcesCollectionModel,
      DataSourcesFieldModel,
      DataSourcesRolesModel,
      DataSourcesRolesResourcesModel,
      DataSourcesRolesResourcesActionModel,
      DataSourceModel,
    });

    this.app.db.on('dataSources.afterSave', async (model: DataSourceModel) => {
      await model.loadIntoApplication({
        app: this.app,
      });
    });

    // this.app.db.on('databaseConnections.beforeCreate', async (model: DatabaseConnectionModel, options) => {
    //   await model.checkConnection();
    // });
    //
    // this.app.db.on('databaseConnections.afterSave', async (model: DatabaseConnectionModel) => {
    //   await model.loadIntoApplication({
    //     app: this.app,
    //   });
    // });

    this.app.db.on('dataSources.afterCreate', async (model: DataSourceModel, options) => {
      const { transaction } = options;
      await this.app.db.getRepository('dataSourcesRolesResourcesScopes').create({
        values: {
          dataSourceKey: model.get('key'),
          key: 'all',
          name: '{{t("All records")}}',
          scope: {},
        },
        transaction,
      });
    });

    this.app.actions({
      async ['databaseConnections:testConnection'](ctx, next) {
        const { values } = ctx.action.params;

        const db = new Database(values);

        try {
          await db.sequelize.authenticate();
        } catch (error) {
          throw new Error(`Unable to connect to the database: ${error.message}`);
        } finally {
          await db.close();
        }

        ctx.body = {
          success: true,
        };

        await next();
      },

      async ['databaseConnections:refresh'](ctx, next) {
        const { filterByTk } = ctx.action.params;
        const databaseConnection = await ctx.db.getRepository('databaseConnections').findOne({
          filter: {
            name: filterByTk,
          },
        });

        await databaseConnection.loadIntoApplication({
          app: ctx.app,
        });

        ctx.body = {
          success: true,
        };

        await next();
      },
    });

    this.app.resourcer.define(remoteCollectionsResourcer);
    this.app.resourcer.define(remoteFieldsResourcer);
    this.app.resourcer.define(rolesRemoteCollectionsResourcer);
    this.app.resourcer.define(databaseConnectionsRolesResourcer);
    this.app.resourcer.define(rolesConnectionResourcesResourcer);

    this.app.resourcer.define({
      name: 'dataSources',
    });

    this.app.resourcer
      .getResource('dataSources')
      .getAction('list')
      .middlewares.push(
        new Middleware(async (ctx, next) => {
          await next();
          const hasCollections = ctx.action.params.appends?.includes('collections');

          const mapData = (row) => {
            const data = row.toJSON();
            if (hasCollections) {
              const dataSource = this.app.dataSourceManager.dataSources.get(data.key);

              const collections = dataSource.collectionManager.getCollections();

              data.collections = collections.map((collection) => {
                const collectionOptions = collection.options;
                const fields = [...collection.fields.values()].map((field) => field.options);

                return {
                  ...collectionOptions,
                  fields,
                };
              });
            }
            return data;
          };
          if (Array.isArray(ctx.body)) {
            ctx.body = ctx.body.map(mapData);
          } else {
            ctx.body.rows = ctx.body.rows.map(mapData);
          }
        }),
      );

    this.app.db.on('dataSourcesFields.afterSave', async (model: DataSourcesFieldModel) => {
      model.load({
        app: this.app,
      });
    });

    this.app.db.on('dataSourcesFields.afterDestroy', async (model: DataSourcesFieldModel) => {
      model.unload({
        app: this.app,
      });
    });

    this.app.db.on('dataSourcesCollections.afterSave', async (model: DataSourcesCollectionModel) => {
      model.load({
        app: this.app,
      });
    });

    this.app.on('afterStart', async (app: Application) => {
      const dataSourcesRecords: DataSourceModel[] = await this.app.db.getRepository('dataSources').find();
      for (const dataSourceRecord of dataSourcesRecords) {
        await dataSourceRecord.loadIntoApplication({
          app,
        });
      }

      // load roles
      const rolesModel: DataSourcesRolesModel[] = await this.app.db.getRepository('dataSourcesRoles').find();
      const pluginACL: any = this.app.pm.get('acl');

      for (const roleModel of rolesModel) {
        await roleModel.writeToAcl({
          grantHelper: pluginACL.grantHelper,
          associationFieldsActions: pluginACL.associationFieldsActions,
          acl: this.app.dataSourceManager.dataSources.get(roleModel.get('dataSourceKey')).acl,
        });
      }
    });

    this.app.db.on('dataSourcesRolesResources.afterSaveWithAssociations', async (model, options) => {
      const { transaction } = options;
      const pluginACL: any = this.app.pm.get('acl');

      const dataSource = this.app.dataSourceManager.dataSources.get(model.get('dataSourceKey'));
      await model.writeToACL({
        acl: dataSource.acl,
        associationFieldsActions: pluginACL.associationFieldsActions,
        transaction: transaction,
        grantHelper: pluginACL.grantHelper,
      });
    });

    this.app.db.on('dataSourcesRoles.afterSave', async (model: DataSourcesRolesModel, options) => {
      const { transaction } = options;

      const pluginACL: any = this.app.pm.get('acl');

      const dataSource = this.app.dataSourceManager.dataSources.get(model.get('dataSourceKey'));

      await model.writeToAcl({
        grantHelper: pluginACL.grantHelper,
        associationFieldsActions: pluginACL.associationFieldsActions,
        acl: dataSource.acl,
        transaction,
      });
    });

    // add global roles check
    this.app.resourcer.use(async (ctx, next) => {
      const action = ctx.action;
      await next();
      const { resourceName, actionName } = action.params;
      if (resourceName === 'roles' && actionName == 'check') {
        const roleName = ctx.state.currentRole;
        const dataSources = await ctx.db.getRepository('dataSources').find();

        ctx.bodyMeta = {
          dataSources: dataSources.reduce((carry, dataSourceModel) => {
            const dataSource = this.app.dataSourceManager.dataSources.get(dataSourceModel.get('key'));

            const aclInstance = dataSource.acl;
            const roleInstance = aclInstance.getRole(roleName);

            const dataObj = {
              strategy: {},
              resources: roleInstance ? [...roleInstance.resources.keys()] : [],
              actions: {},
            };

            if (roleInstance) {
              const data = roleInstance.toJSON();
              dataObj['name'] = data['name'];
              dataObj['strategy'] = data['strategy'];
              dataObj['actions'] = data['actions'];
            }

            carry[dataSourceModel.get('key')] = dataObj;

            return carry;
          }, {}),
        };
      }
    });

    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: ['dataSources:*', 'roles.dataSourceResources'],
    });
  }

  async load() {
    await this.importCollections(resolve(__dirname, 'collections'));
  }
}

export default PluginDataSourceManagerServer;
