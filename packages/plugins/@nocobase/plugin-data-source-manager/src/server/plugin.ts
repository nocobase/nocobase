import { Application, Plugin } from '@nocobase/server';
import { resolve } from 'path';
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
import { DataSourceModel } from './models/data-source';
import lodash from 'lodash';

type DataSourceState = 'loading' | 'loaded' | 'failed';

export class PluginDataSourceManagerServer extends Plugin {
  public dataSourceErrors: {
    [dataSourceKey: string]: Error;
  } = {};

  public dataSourceStatus: {
    [dataSourceKey: string]: DataSourceState;
  } = {};

  async beforeLoad() {
    this.app.db.registerModels({
      DataSourcesCollectionModel,
      DataSourcesFieldModel,
      DataSourcesRolesModel,
      DataSourcesRolesResourcesModel,
      DataSourcesRolesResourcesActionModel,
      DataSourceModel,
    });

    this.app.db.on('dataSources.beforeCreate', async (model: DataSourceModel, options) => {
      this.dataSourceStatus[model.get('key')] = 'loading';
    });

    this.app.db.on('dataSources.beforeSave', async (model: DataSourceModel) => {
      if (model.changed('options')) {
        const dataSourceOptions = model.get('options');
        const type = model.get('type');

        const klass = this.app.dataSourceManager.factory.getClass(type);

        try {
          await klass.testConnection(dataSourceOptions);
        } catch (error) {
          throw new Error(`Test connection failed: ${error.message}`);
        }
      }
    });

    this.app.db.on('dataSources.afterSave', async (model: DataSourceModel, options) => {
      if (model.changed('options')) {
        model.loadIntoApplication({
          app: this.app,
        });
      }
    });

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

    const app = this.app;

    this.app.use(async (ctx, next) => {
      await next();
      if (!ctx.action) {
        return;
      }

      const { actionName, resourceName, params } = ctx.action;

      if (resourceName === 'dataSources' && actionName == 'list') {
        let dataPath = 'body';

        if (Array.isArray(ctx.body['data'])) {
          dataPath = 'body.data';
        }

        const items = lodash.get(ctx, dataPath);

        lodash.set(
          ctx,
          dataPath,
          items.map((item) => {
            const data = item.toJSON();
            const dataSourceStatus = this.dataSourceStatus[item.get('key')];
            data['status'] = dataSourceStatus;

            if (dataSourceStatus === 'failed') {
              data['errorMessage'] = this.dataSourceErrors[item.get('key')].message;
            }
            return data;
          }),
        );
      }
    });

    const plugin = this;
    this.app.actions({
      async ['dataSources:listEnabled'](ctx, next) {
        const dataSources = await ctx.db.getRepository('dataSources').find({
          filter: {
            enabled: true,
          },
        });

        ctx.body = dataSources.map((dataSourceModel) => {
          const dataSourceStatus = plugin.dataSourceStatus[dataSourceModel.get('key')];

          const item: any = {
            key: dataSourceModel.get('key'),
            displayName: dataSourceModel.get('displayName'),
            status: dataSourceStatus,
          };

          if (dataSourceStatus === 'failed') {
            item['errorMessage'] = plugin.dataSourceErrors[dataSourceModel.get('key')].message;
          }

          const dataSource = app.dataSourceManager.dataSources.get(dataSourceModel.get('key'));

          if (!dataSource) {
            return item;
          }

          const collections = dataSource.collectionManager.getCollections();

          item.collections = collections.map((collection) => {
            const collectionOptions = collection.options;
            const fields = [...collection.fields.values()].map((field) => field.options);

            return {
              ...collectionOptions,
              fields,
            };
          });

          return item;
        });

        await next();
      },

      async ['dataSources:testConnection'](ctx, next) {
        const { values } = ctx.action.params;

        const { options, type } = values;

        const klass = ctx.app.dataSourceManager.factory.getClass(type);

        try {
          await klass.testConnection(options);
        } catch (error) {
          throw new Error(`Test connection failed: ${error.message}`);
        }

        ctx.body = {
          success: true,
        };

        await next();
      },

      async ['dataSources:refresh'](ctx, next) {
        const { filterByTk } = ctx.action.params;
        const dataSourceModel: DataSourceModel = await ctx.db.getRepository('dataSources').findOne({
          filter: {
            key: filterByTk,
          },
        });

        dataSourceModel.loadIntoApplication({
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
        dataSourceRecord.loadIntoApplication({
          app,
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
            if (!dataSource) {
              return carry;
            }

            const dataSourceStatus = this.dataSourceStatus[dataSourceModel.get('key')];
            if (dataSourceStatus !== 'loaded') {
              return carry;
            }

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
