import { Model, Transaction } from '@nocobase/database';
import { Application } from '@nocobase/server';
import { LocalData } from '../services/database-introspector';
import { setCurrentRole } from '@nocobase/plugin-acl';
import { ACL, AvailableActionOptions } from '@nocobase/acl';
import { DataSourcesRolesModel } from './data-sources-roles-model';
import PluginDataSourceManagerServer from '../plugin';

const availableActions: {
  [key: string]: AvailableActionOptions;
} = {
  create: {
    displayName: '{{t("Add new")}}',
    type: 'new-data',
    onNewRecord: true,
    allowConfigureFields: true,
  },
  // import: {
  //   displayName: '{{t("Import")}}',
  //   type: 'new-data',
  //   scope: false,
  // },
  // export: {
  //   displayName: '{{t("Export")}}',
  //   type: 'old-data',
  //   allowConfigureFields: true,
  // },
  view: {
    displayName: '{{t("View")}}',
    type: 'old-data',
    aliases: ['get', 'list'],
    allowConfigureFields: true,
  },
  update: {
    displayName: '{{t("Edit")}}',
    type: 'old-data',
    aliases: ['update', 'move'],
    allowConfigureFields: true,
  },
  destroy: {
    displayName: '{{t("Delete")}}',
    type: 'old-data',
  },
};

export class DataSourceModel extends Model {
  isMainRecord() {
    return this.get('type') === 'main';
  }

  async loadIntoACL(options: { app: Application; acl: ACL; transaction?: Transaction }) {
    const { app, acl } = options;
    const loadRoleIntoACL = async (model: DataSourcesRolesModel) => {
      const pluginACL: any = app.pm.get('acl');

      await model.writeToAcl({
        grantHelper: pluginACL.grantHelper,
        associationFieldsActions: pluginACL.associationFieldsActions,
        acl,
      });
    };

    const rolesModel: DataSourcesRolesModel[] = await app.db.getRepository('dataSourcesRoles').find({
      transaction: options.transaction,
      filter: {
        dataSourceKey: this.get('key'),
      },
    });

    for (const roleModel of rolesModel) {
      await loadRoleIntoACL(roleModel);
    }
  }

  async loadIntoApplication(options: { app: Application; transaction?: Transaction; loadAtAfterStart?: boolean }) {
    const { app, loadAtAfterStart } = options;

    const dataSourceKey = this.get('key');

    const pluginDataSourceManagerServer = app.pm.get('data-source-manager') as PluginDataSourceManagerServer;

    if (pluginDataSourceManagerServer.dataSourceStatus[dataSourceKey] === 'loaded') {
      pluginDataSourceManagerServer.dataSourceStatus[dataSourceKey] = 'reloading';
    } else {
      pluginDataSourceManagerServer.dataSourceStatus[dataSourceKey] = 'loading';
    }

    const type = this.get('type');
    const createOptions = this.get('options');

    const dataSource = app.dataSourceManager.factory.create(type, {
      ...createOptions,
      name: this.get('key'),
    });

    if (loadAtAfterStart) {
      dataSource.on('loadMessage', ({ message }) => {
        app.setMaintainingMessage(`${message} in data source ${this.get('displayName')}`);
      });
    }

    const acl = dataSource.acl;

    for (const [actionName, actionParams] of Object.entries(availableActions)) {
      acl.setAvailableAction(actionName, actionParams);
    }

    acl.allow('*', '*', (ctx) => {
      return ctx.state.currentRole === 'root';
    });

    dataSource.resourceManager.use(setCurrentRole, { tag: 'setCurrentRole', before: 'acl', after: 'auth' });

    await this.loadIntoACL({ app, acl, transaction: options.transaction });

    try {
      await app.dataSourceManager.add(dataSource, {
        localData: await this.loadLocalData(),
      });
    } catch (e) {
      app.logger.error(`load data source failed, ${e}`);

      if (pluginDataSourceManagerServer.dataSourceStatus[dataSourceKey] === 'loading') {
        pluginDataSourceManagerServer.dataSourceStatus[dataSourceKey] = 'loading-failed';
      }

      if (pluginDataSourceManagerServer.dataSourceStatus[dataSourceKey] === 'reloading') {
        pluginDataSourceManagerServer.dataSourceStatus[dataSourceKey] = 'reloading-failed';
      }

      pluginDataSourceManagerServer.dataSourceErrors[dataSourceKey] = e;
      return;
    }

    pluginDataSourceManagerServer.dataSourceStatus[dataSourceKey] = 'loaded';
  }

  private async loadLocalData(): Promise<LocalData> {
    const dataSourceKey = this.get('key');

    const remoteCollections = await this.db.getRepository('dataSourcesCollections').find({
      filter: {
        dataSourceKey,
      },
    });

    const remoteFields = await this.db.getRepository('dataSourcesFields').find({
      filter: {
        dataSourceKey,
      },
    });

    const localData = {};

    for (const remoteCollection of remoteCollections) {
      const remoteCollectionOptions = remoteCollection.toJSON();
      localData[remoteCollectionOptions.name] = remoteCollectionOptions;
    }

    for (const remoteField of remoteFields) {
      const remoteFieldOptions = remoteField.toJSON();
      const collectionName = remoteFieldOptions.collectionName;

      if (!localData[collectionName]) {
        localData[collectionName] = {
          name: collectionName,
          fields: [],
        };
      }

      if (!localData[collectionName].fields) {
        localData[collectionName].fields = [];
      }

      localData[collectionName].fields.push(remoteFieldOptions);
    }

    return localData;
  }
}
