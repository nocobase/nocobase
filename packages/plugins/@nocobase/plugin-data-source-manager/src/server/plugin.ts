import { Application, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { DatabaseConnectionModel } from './models/database-connection';
import { Database } from '@nocobase/database';
import remoteCollectionsResourcer from './resourcers/remote-collections';
import remoteFieldsResourcer from './resourcers/remote-fields';
import { RemoteCollectionModel } from './models/remote-collection-model';
import { RemoteFieldModel } from './models/remote-field-model';
import { rolesRemoteCollectionsResourcer } from './resourcers/roles-remote-collections';
import databaseConnectionsRolesResourcer from './resourcers/database-connections-roles';
import rolesConnectionResourcesResourcer from './resourcers/connection-resources';

import { ConnectionsRolesModel } from './models/connections-roles-model';
import { ConnectionsRolesResourcesModel } from './models/connections-roles-resources';
import { ConnectionsRolesResourcesActionModel } from './models/connections-roles-resources-action';
import { Middleware } from '@nocobase/resourcer';

export class PluginDatabaseConnectionsServer extends Plugin {
  async beforeLoad() {
    this.app.db.registerModels({
      DatabaseConnectionModel,
      RemoteCollectionModel,
      RemoteFieldModel,
      ConnectionsRolesModel,
      ConnectionsRolesResourcesModel,
      ConnectionsRolesResourcesActionModel,
    });

    this.app.db.on('databaseConnections.beforeCreate', async (model: DatabaseConnectionModel, options) => {
      await model.checkConnection();
    });

    this.app.db.on('databaseConnections.afterSave', async (model: DatabaseConnectionModel) => {
      await model.loadIntoApplication({
        app: this.app,
      });
    });

    this.app.db.on('databaseConnections.afterCreate', async (model: DatabaseConnectionModel, options) => {
      const { transaction } = options;
      await this.app.db.getRepository('connectionsRolesResourcesScopes').create({
        values: {
          connectionName: model.get('name'),
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
      name: 'databaseConnections',
    });

    this.app.resourcer
      .getResource('databaseConnections')
      .getAction('list')
      .middlewares.push(
        new Middleware(async (ctx, next) => {
          await next();
          const hasCollections = ctx.action.params.appends?.includes('collections');

          const mapData = (row) => {
            const data = row.toJSON();
            if (hasCollections) {
              const database = ctx.app.getDb(data.name);
              const collections = [...database.collections.values()].filter(
                (collection) => collection.options.introspected,
              );
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

    this.app.db.on('remoteFields.afterSave', async (model: RemoteFieldModel) => {
      model.load({
        app: this.app,
      });
    });

    this.app.db.on('remoteFields.afterDestroy', async (model: RemoteFieldModel) => {
      model.unload({
        app: this.app,
      });
    });

    this.app.db.on('remoteCollections.afterSave', async (model: RemoteCollectionModel) => {
      model.load({
        app: this.app,
      });
    });

    this.app.on('afterStart', async (app: Application) => {
      const databaseConnections: DatabaseConnectionModel[] = await this.app.db
        .getRepository('databaseConnections')
        .find();

      // load all connections
      for (const databaseConnection of databaseConnections) {
        await databaseConnection.loadIntoApplication({
          app,
        });
      }

      // load roles
      const rolesModel: ConnectionsRolesModel[] = await this.app.db.getRepository('connectionsRoles').find();
      const pluginACL: any = this.app.pm.get('acl');

      for (const roleModel of rolesModel) {
        await roleModel.writeToAcl({
          grantHelper: pluginACL.grantHelper,
          associationFieldsActions: pluginACL.associationFieldsActions,
          acl: this.app.acls.get(roleModel.get('connectionName')),
        });
      }
    });

    this.app.db.on('connectionsRolesResources.afterSaveWithAssociations', async (model, options) => {
      const { transaction } = options;
      const pluginACL: any = this.app.pm.get('acl');

      await model.writeToACL({
        acl: this.app.acls.get(model.get('connectionName')),
        associationFieldsActions: pluginACL.associationFieldsActions,
        transaction: transaction,
        grantHelper: pluginACL.grantHelper,
      });
    });

    this.app.db.on('connectionsRoles.afterSave', async (model: ConnectionsRolesModel, options) => {
      const { transaction } = options;

      const pluginACL: any = this.app.pm.get('acl');

      await model.writeToAcl({
        grantHelper: pluginACL.grantHelper,
        associationFieldsActions: pluginACL.associationFieldsActions,
        acl: this.app.acls.get(model.get('connectionName')),
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
        const connections = await ctx.db.getRepository('databaseConnections').find();

        ctx.bodyMeta = {
          dataSources: connections.reduce((carry, connectionModel) => {
            const aclInstance = this.app.acls.get(connectionModel.get('name'));
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

            carry[connectionModel.get('name')] = dataObj;

            return carry;
          }, {}),
        };
      }
    });

    this.app.acl.registerSnippet({
      name: `pm.${this.name}`,
      actions: ['databaseConnections:*', 'remoteCollections:*', 'roles.connectionResources'],
    });
  }

  async load() {
    await this.importCollections(resolve(__dirname, 'collections'));
  }
}

export default PluginDatabaseConnectionsServer;
