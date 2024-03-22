import { Application, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { DataSourcesCollectionModel } from './models/data-sources-collection-model';
import { DataSourcesFieldModel } from './models/data-sources-field-model';
import remoteCollectionsResourcer from './resourcers/data-sources-collections';
import remoteFieldsResourcer from './resourcers/data-sources-collections-fields';
import rolesConnectionResourcesResourcer from './resourcers/data-sources-resources';
import databaseConnectionsRolesResourcer from './resourcers/data-sources-roles';
import { rolesRemoteCollectionsResourcer } from './resourcers/roles-data-sources-collections';

import lodash from 'lodash';
import { DataSourcesRolesResourcesModel } from './models/connections-roles-resources';
import { DataSourcesRolesResourcesActionModel } from './models/connections-roles-resources-action';
import { DataSourceModel } from './models/data-source';
import { DataSourcesRolesModel } from './models/data-sources-roles-model';

type DataSourceState = 'loading' | 'loaded' | 'loading-failed' | 'reloading' | 'reloading-failed';

const canRefreshStatus = ['loaded', 'loading-failed', 'reloading-failed'];

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

    this.app.db.on('dataSourcesFields.beforeCreate', async (model, options) => {
      const validatePresent = (name: string) => {
        if (!model.get(name)) {
          throw new Error(`"${name}" is required`);
        }
      };

      const validatePresents = (names: string[]) => {
        names.forEach((name) => validatePresent(name));
      };

      const type = model.get('type');

      if (type === 'belongsTo') {
        validatePresents(['foreignKey', 'targetKey', 'target']);
      }

      if (type === 'hasMany') {
        validatePresents(['foreignKey', 'sourceKey', 'target']);
      }

      if (type == 'hasOne') {
        validatePresents(['foreignKey', 'sourceKey', 'target']);
      }

      if (type === 'belongsToMany') {
        validatePresents(['foreignKey', 'otherKey', 'sourceKey', 'targetKey', 'through', 'target']);
      }
    });

    this.app.db.on('dataSources.beforeCreate', async (model: DataSourceModel, options) => {
      this.dataSourceStatus[model.get('key')] = 'loading';
    });

    this.app.db.on('dataSources.beforeSave', async (model: DataSourceModel) => {
      if (model.changed('options') && !model.isMainRecord()) {
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
      if (model.changed('options') && !model.isMainRecord()) {
        model.loadIntoApplication({
          app: this.app,
        });
      }
    });

    this.app.db.on('dataSources.afterCreate', async (model: DataSourceModel, options) => {
      if (model.isMainRecord()) {
        return;
      }

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
            if (item.isMainRecord()) {
              data['status'] = 'loaded';
              return data;
            }

            const dataSourceStatus = this.dataSourceStatus[item.get('key')];
            data['status'] = dataSourceStatus;

            if (dataSourceStatus === 'loading-failed' || dataSourceStatus === 'reloading-failed') {
              data['errorMessage'] = this.dataSourceErrors[item.get('key')].message;
            }

            return data;
          }),
        );
      }
    });

    const plugin = this;

    const mapDataSourceWithCollection = (dataSourceModel, appendCollections = true) => {
      const dataSource = app.dataSourceManager.dataSources.get(dataSourceModel.get('key'));
      const dataSourceStatus = plugin.dataSourceStatus[dataSourceModel.get('key')];

      const item: any = {
        key: dataSourceModel.get('key'),
        displayName: dataSourceModel.get('displayName'),
        status: dataSourceStatus,
        type: dataSourceModel.get('type'),

        // @ts-ignore
        isDBInstance: !!dataSource?.collectionManager.db,
      };

      if (dataSourceStatus === 'loading-failed' || dataSourceStatus === 'reloading-failed') {
        item['errorMessage'] = plugin.dataSourceErrors[dataSourceModel.get('key')].message;
      }

      if (!dataSource) {
        return item;
      }

      if (appendCollections) {
        const collections = dataSource.collectionManager.getCollections();

        item.collections = collections.map((collection) => {
          const collectionOptions = collection.options;
          const fields = [...collection.fields.values()].map((field) => field.options);

          return {
            ...collectionOptions,
            fields,
          };
        });
      }

      return item;
    };

    this.app.resourcer.use(async (ctx, next) => {
      if (!ctx.action) {
        await next();
        return;
      }

      const { actionName, resourceName, params } = ctx.action;

      if (resourceName === 'dataSources' && actionName == 'list') {
        if (!params.sort) {
          params.sort = ['-fixed', 'createdAt'];
        }
      }

      await next();
    });

    this.app.use(async (ctx, next) => {
      await next();

      if (!ctx.action) {
        return;
      }

      const { actionName, resourceName, params } = ctx.action;

      if (resourceName === 'dataSources' && actionName == 'get') {
        let appendCollections = false;
        const appends = ctx.action.params.appends;
        if (appends && appends.includes('collections')) {
          appendCollections = true;
        }
        if (ctx.body.data) {
          ctx.body.data = mapDataSourceWithCollection(ctx.body.data, appendCollections);
        } else {
          ctx.body = mapDataSourceWithCollection(ctx.body, appendCollections);
        }
      }
    });

    this.app.actions({
      async ['dataSources:listEnabled'](ctx, next) {
        const dataSources = await ctx.db.getRepository('dataSources').find({
          filter: {
            enabled: true,
            'type.$ne': 'main',
          },
        });

        ctx.body = dataSources.map((dataSourceModel) => {
          return mapDataSourceWithCollection(dataSourceModel);
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
        const { filterByTk, clientStatus } = ctx.action.params;
        const dataSourceModel: DataSourceModel = await ctx.db.getRepository('dataSources').findOne({
          filter: {
            key: filterByTk,
          },
        });

        const currentStatus = plugin.dataSourceStatus[filterByTk];

        if (
          canRefreshStatus.includes(currentStatus) &&
          (clientStatus ? clientStatus && canRefreshStatus.includes(clientStatus) : true)
        ) {
          dataSourceModel.loadIntoApplication({
            app: ctx.app,
          });
        }

        ctx.body = {
          status: plugin.dataSourceStatus[filterByTk],
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

    this.app.db.on('dataSources.afterDestroy', async (model: DataSourceModel) => {
      this.app.dataSourceManager.dataSources.delete(model.get('key'));
    });

    this.app.on('afterStart', async (app: Application) => {
      const dataSourcesRecords: DataSourceModel[] = await this.app.db.getRepository('dataSources').find({
        filter: {
          enabled: true,
        },
      });

      const loadPromises = dataSourcesRecords.map((dataSourceRecord) => {
        if (dataSourceRecord.isMainRecord()) {
          return dataSourceRecord.loadIntoACL({ app, acl: app.acl });
        }

        return dataSourceRecord.loadIntoApplication({ app, loadAtAfterStart: true });
      });

      this.app.setMaintainingMessage('Loading data sources...');
      await Promise.all(loadPromises);
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

    this.app.db.on('dataSourcesRolesResourcesActions.afterUpdateWithAssociations', async (model, options) => {
      const { transaction } = options;

      const resource = await model.getResource({
        transaction,
      });

      const pluginACL: any = this.app.pm.get('acl');

      const dataSource = this.app.dataSourceManager.dataSources.get(resource.get('dataSourceKey'));
      await resource.writeToACL({
        acl: dataSource.acl,
        associationFieldsActions: pluginACL.associationFieldsActions,
        transaction: transaction,
        grantHelper: pluginACL.grantHelper,
      });
    });

    this.app.db.on('dataSourcesRolesResources.afterDestroy', async (model, options) => {
      const dataSource = this.app.dataSourceManager.dataSources.get(model.get('dataSourceKey'));
      const roleName = model.get('roleName');
      const role = dataSource.acl.getRole(roleName);

      if (role) {
        role.revokeResource(model.get('name'));
      }
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

    this.app.on('acl:writeResources', async ({ roleName, transaction }) => {
      const dataSource = this.app.dataSourceManager.dataSources.get('main');
      const pluginACL: any = this.app.pm.get('acl');

      const dataSourceRole = await this.app.db.getRepository('dataSourcesRoles').findOne({
        filter: {
          dataSourceKey: 'main',
          roleName,
        },
        transaction,
      });

      await dataSourceRole.writeToAcl({
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
      actions: [
        'dataSources:*',
        'roles.dataSourceResources',
        'collections:*',
        'collections.fields:*',
        'dbViews:*',
        'collectionCategories:*',
        'sqlCollection:*',
      ],
    });

    this.app.acl.allow('dataSources', 'listEnabled', 'loggedIn');
    this.app.acl.allow('dataSources', 'get', 'loggedIn');

    this.app.acl.addFixedParams('dataSources', 'destroy', () => {
      return {
        filter: {
          'key.$ne': 'main',
        },
      };
    });
  }

  async load() {
    await this.importCollections(resolve(__dirname, 'collections'));
  }
}

export default PluginDataSourceManagerServer;
