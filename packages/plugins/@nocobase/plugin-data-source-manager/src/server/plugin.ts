/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Application, Plugin } from '@nocobase/server';
import { resolve } from 'path';
import { DataSourcesCollectionModel } from './models/data-sources-collection-model';
import { DataSourcesFieldModel } from './models/data-sources-field-model';
import remoteCollectionsResourcer from './resourcers/data-sources-collections';
import remoteFieldsResourcer from './resourcers/data-sources-collections-fields';
import rolesConnectionResourcesResourcer from './resourcers/data-sources-resources';
import databaseConnectionsRolesResourcer from './resourcers/data-sources-roles';
import { rolesRemoteCollectionsResourcer } from './resourcers/roles-data-sources-collections';

import { LoadingProgress } from '@nocobase/data-source-manager';
import lodash from 'lodash';
import { DataSourcesRolesResourcesModel } from './models/connections-roles-resources';
import { DataSourcesRolesResourcesActionModel } from './models/connections-roles-resources-action';
import { DataSourceModel } from './models/data-source';
import { DataSourcesRolesModel } from './models/data-sources-roles-model';
import { mergeRole } from '@nocobase/acl';

type DataSourceState = 'loading' | 'loaded' | 'loading-failed' | 'reloading' | 'reloading-failed';

const canRefreshStatus = ['loaded', 'loading-failed', 'reloading-failed'];

export class PluginDataSourceManagerServer extends Plugin {
  public dataSourceErrors: {
    [dataSourceKey: string]: Error;
  } = {};

  public dataSourceStatus: {
    [dataSourceKey: string]: DataSourceState;
  } = {};

  async handleSyncMessage(message) {
    const { type } = message;
    if (type === 'syncRole') {
      const { roleName, dataSourceKey } = message;
      const dataSource = this.app.dataSourceManager.dataSources.get(dataSourceKey);

      const dataSourceRole: DataSourcesRolesModel = await this.app.db.getRepository('dataSourcesRoles').findOne({
        filter: {
          dataSourceKey,
          roleName,
        },
      });

      await dataSourceRole.writeToAcl({
        acl: dataSource.acl,
      });
    }

    if (type === 'syncRoleResource') {
      const { roleName, dataSourceKey, resourceName } = message;
      const dataSource = this.app.dataSourceManager.dataSources.get(dataSourceKey);

      const dataSourceRoleResource: DataSourcesRolesResourcesModel = await this.app.db
        .getRepository('dataSourcesRolesResources')
        .findOne({
          filter: {
            dataSourceKey,
            roleName,
            name: resourceName,
          },
        });

      await dataSourceRoleResource.writeToACL({
        acl: dataSource.acl,
      });
    }
    if (type === 'loadDataSource') {
      const { dataSourceKey } = message;
      const dataSourceModel = await this.app.db.getRepository('dataSources').findOne({
        filter: {
          key: dataSourceKey,
        },
      });

      if (!dataSourceModel) {
        return;
      }

      await dataSourceModel.loadIntoApplication({
        app: this.app,
      });
    }

    if (type === 'loadDataSourceField') {
      const { key } = message;
      const fieldModel = await this.app.db.getRepository('dataSourcesFields').findOne({
        filter: {
          key,
        },
      });

      fieldModel.load({
        app: this.app,
      });
    }
    if (type === 'removeDataSourceCollection') {
      const { dataSourceKey, collectionName } = message;
      const dataSource = this.app.dataSourceManager.dataSources.get(dataSourceKey);
      dataSource.collectionManager.removeCollection(collectionName);
    }

    if (type === 'removeDataSourceField') {
      const { key } = message;
      const fieldModel = await this.app.db.getRepository('dataSourcesFields').findOne({
        filter: {
          key,
        },
      });

      fieldModel.unload({
        app: this.app,
      });
    }

    if (type === 'removeDataSource') {
      const { dataSourceKey } = message;
      this.app.dataSourceManager.dataSources.delete(dataSourceKey);
    }
  }

  public dataSourceLoadingProgress: {
    [dataSourceKey: string]: LoadingProgress;
  } = {};

  renderJsonTemplate(template) {
    return this.app.environment.renderJsonTemplate(template);
  }

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

        if (!klass) {
          throw new Error(`Data source type "${type}" is not registered`);
        }

        try {
          await klass.testConnection(this.renderJsonTemplate(dataSourceOptions || {}));
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

        this.sendSyncMessage(
          {
            type: 'loadDataSource',
            dataSourceKey: model.get('key'),
          },
          {
            transaction: options.transaction,
          },
        );
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

    this.app.use(async function setDataSourceListItemStatus(ctx, next) {
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

        if (!Array.isArray(items)) {
          return;
        }

        lodash.set(
          ctx,
          dataPath,
          items.map((item) => {
            const data = item.toJSON();
            if (item.isMainRecord()) {
              data['status'] = 'loaded';
              return data;
            }

            const dataSourceStatus = plugin.dataSourceStatus[item.get('key')];
            data['status'] = dataSourceStatus;

            if (dataSourceStatus === 'loading-failed' || dataSourceStatus === 'reloading-failed') {
              data['errorMessage'] = plugin.dataSourceErrors[item.get('key')].message;
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

      const publicOptions = dataSource?.publicOptions();
      if (publicOptions) {
        item['options'] = publicOptions;
      }

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
          const collectionInstance = dataSource.collectionManager.getCollection(collectionOptions.name);

          const fields = [...collection.fields.values()].map((field) => field.options);

          const results = {
            ...collectionOptions,
            fields,
          };

          if (collectionInstance && collectionInstance.availableActions) {
            results['availableActions'] = collectionInstance.availableActions();
          }

          if (collectionInstance && collectionInstance.unavailableActions) {
            results['unavailableActions'] = collectionInstance.unavailableActions();
          }

          return results;
        });
      }

      return item;
    };

    this.app.resourceManager.use(async function setDataSourceListDefaultSort(ctx, next) {
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

    this.app.use(async function handleAppendDataSourceCollection(ctx, next) {
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

    const self = this;
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
          await klass.testConnection(self.renderJsonTemplate(options));
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
            refresh: true,
          });

          ctx.app.syncMessageManager.publish(self.name, {
            type: 'loadDataSource',
            dataSourceKey: dataSourceModel.get('key'),
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

    this.app.db.on('dataSourcesFields.beforeSave', async (model: DataSourcesFieldModel, options) => {
      const { transaction } = options;
      if (!model.get('collectionName') || !model.get('dataSourceKey')) {
        const collectionKey = model.get('collectionKey');
        if (!collectionKey) {
          throw new Error('collectionKey is required');
        }

        const collection = await model.getCollection({ transaction });

        model.set('collectionName', collection.get('name'));
        model.set('dataSourceKey', collection.get('dataSourceKey'));
      }
    });

    this.app.db.on('dataSourcesCollections.afterDestroy', async (model: DataSourcesCollectionModel, options) => {
      const dataSource = this.app.dataSourceManager.dataSources.get(model.get('dataSourceKey'));
      if (dataSource) {
        dataSource.collectionManager.removeCollection(model.get('name'));
      }

      this.sendSyncMessage(
        {
          type: 'removeDataSourceCollection',
          dataSourceKey: model.get('dataSourceKey'),
          collectionName: model.get('name'),
        },
        {
          transaction: options.transaction,
        },
      );
    });

    this.app.db.on('dataSourcesFields.afterSaveWithAssociations', async (model: DataSourcesFieldModel, options) => {
      model.load({
        app: this.app,
      });

      this.sendSyncMessage(
        {
          type: 'loadDataSourceField',
          key: model.get('key'),
        },
        {
          transaction: options.transaction,
        },
      );
    });

    this.app.db.on('dataSourcesFields.afterDestroy', async (model: DataSourcesFieldModel, options) => {
      model.unload({
        app: this.app,
      });

      this.sendSyncMessage(
        {
          type: 'removeDataSourceField',
          key: model.get('key'),
        },
        {
          transaction: options.transaction,
        },
      );
    });

    this.app.db.on(
      'dataSourcesCollections.afterSaveWithAssociations',
      async (model: DataSourcesCollectionModel, { transaction }) => {
        await model.load({
          app: this.app,
          transaction,
        });
      },
    );

    this.app.db.on('dataSources.afterDestroy', async (model: DataSourceModel, options) => {
      this.app.dataSourceManager.dataSources.delete(model.get('key'));

      this.sendSyncMessage(
        {
          type: 'removeDataSource',
          dataSourceKey: model.get('key'),
        },
        {
          transaction: options.transaction,
        },
      );
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

    this.app.db.on(
      'dataSourcesRolesResources.afterSaveWithAssociations',
      async (model: DataSourcesRolesResourcesModel, options) => {
        const { transaction } = options;

        const dataSource = this.app.dataSourceManager.dataSources.get(model.get('dataSourceKey'));
        await model.writeToACL({
          acl: dataSource.acl,
          transaction: transaction,
        });

        // sync roles resources between nodes
        this.sendSyncMessage(
          {
            type: 'syncRoleResource',
            roleName: model.get('roleName'),
            dataSourceKey: model.get('dataSourceKey'),
            resourceName: model.get('name'),
          },
          {
            transaction,
          },
        );
      },
    );

    this.app.db.on('dataSourcesRolesResourcesScopes.afterSaveWithAssociations', async (model, options) => {
      const { transaction } = options;
      const dataSourcesRolesResourcesActions: DataSourcesRolesResourcesActionModel[] = await this.app.db
        .getRepository('dataSourcesRolesResourcesActions')
        .find({
          filter: { scopeId: model.get('id') },
          transaction,
        });
      const rolesRolesResourceIds = dataSourcesRolesResourcesActions.map((x) => x.get('rolesResourceId'));
      const dataSourcesRolesResources: DataSourcesRolesResourcesModel[] = await this.app.db
        .getRepository('dataSourcesRolesResources')
        .find({
          filter: {
            id: rolesRolesResourceIds,
          },
          transaction,
        });
      for (const instance of dataSourcesRolesResources) {
        await this.app.db.emitAsync(`dataSourcesRolesResources.afterSaveWithAssociations`, instance, {
          ...options,
          transaction,
        });
      }
    });

    this.app.db.on(
      'dataSourcesRolesResourcesActions.afterUpdateWithAssociations',
      async (model: DataSourcesRolesResourcesActionModel, options) => {
        const { transaction } = options;

        const resource: DataSourcesRolesResourcesModel = await model.getResource({
          transaction,
        });

        const dataSource = this.app.dataSourceManager.dataSources.get(resource.get('dataSourceKey'));
        await resource.writeToACL({
          acl: dataSource.acl,
          transaction: transaction,
        });

        this.sendSyncMessage(
          {
            type: 'syncRoleResource',
            roleName: resource.get('roleName'),
            dataSourceKey: resource.get('dataSourceKey'),
            resourceName: resource.get('name'),
          },
          {
            transaction,
          },
        );
      },
    );

    this.app.db.on('dataSourcesRolesResources.afterDestroy', async (model: DataSourcesRolesResourcesModel, options) => {
      const dataSource = this.app.dataSourceManager.dataSources.get(model.get('dataSourceKey'));
      const roleName = model.get('roleName');
      const role = dataSource.acl.getRole(roleName);

      if (role) {
        role.revokeResource(model.get('name'));
      }

      this.sendSyncMessage(
        {
          type: 'syncRoleResource',
          roleName,
          dataSourceKey: model.get('dataSourceKey'),
          resourceName: model.get('name'),
        },
        {
          transaction: options.transaction,
        },
      );
    });

    this.app.db.on('dataSourcesRoles.afterSave', async (model: DataSourcesRolesModel, options) => {
      const { transaction } = options;

      const dataSource = this.app.dataSourceManager.dataSources.get(model.get('dataSourceKey'));

      await model.writeToAcl({
        acl: dataSource.acl,
        transaction,
      });

      await this.app.db.getRepository('roles').update({
        filter: {
          name: model.get('roleName'),
        },
        values: {
          strategy: model.get('strategy'),
        },
        hooks: false,
        transaction,
      });

      // sync role between nodes
      this.sendSyncMessage(
        {
          type: 'syncRole',
          roleName: model.get('roleName'),
          dataSourceKey: model.get('dataSourceKey'),
        },
        {
          transaction,
        },
      );
    });

    this.app.on('acl:writeResources', async ({ roleName, transaction }) => {
      const dataSource = this.app.dataSourceManager.dataSources.get('main');

      const dataSourceRole: DataSourcesRolesModel = await this.app.db.getRepository('dataSourcesRoles').findOne({
        filter: {
          dataSourceKey: 'main',
          roleName,
        },
        transaction,
      });

      await dataSourceRole.writeToAcl({
        acl: dataSource.acl,
        transaction,
      });
    });

    // add global roles check
    this.app.resourceManager.use(async function appendDataToRolesCheck(ctx, next) {
      const action = ctx.action;
      await next();
      const { resourceName, actionName } = action.params;
      if (resourceName === 'roles' && actionName == 'check') {
        const roleNames = ctx.state.currentRoles;
        const dataSources = await ctx.db.getRepository('dataSources').find();

        ctx.bodyMeta = {
          dataSources: dataSources.reduce((carry, dataSourceModel) => {
            const dataSource = self.app.dataSourceManager.dataSources.get(dataSourceModel.get('key'));
            if (!dataSource) {
              return carry;
            }

            const dataSourceStatus = self.dataSourceStatus[dataSourceModel.get('key')];
            if (dataSourceStatus !== 'loaded') {
              return carry;
            }

            const aclInstance = dataSource.acl;
            const roleInstances = aclInstance.getRoles(roleNames);
            const dataObj = mergeRole(roleInstances);

            carry[dataSourceModel.get('key')] = dataObj;

            return carry;
          }, {}),
        };
      }
    });

    this.app.acl.registerSnippet({
      name: `pm.data-source-manager`,
      actions: [
        'dataSources:*',
        'dataSources.collections:*',
        'dataSourcesCollections.fields:*',
        'roles.dataSourceResources',
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
