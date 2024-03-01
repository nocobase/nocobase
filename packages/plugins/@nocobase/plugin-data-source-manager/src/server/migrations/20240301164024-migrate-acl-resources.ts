import { Migration } from '@nocobase/server';

export default class extends Migration {
  on = 'afterSync'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<0.19.0-alpha.10';

  async up() {
    const transaction = await this.db.sequelize.transaction();

    const scopeMap = {};

    const oldScopes = await this.db.getRepository('rolesResourcesScopes').find({
      transaction,
    });

    for (const oldScope of oldScopes) {
      const key = oldScope.key;
      const newScope = await this.db.getRepository('scopes').firstOrCreate({
        values: {
          key,
          name: oldScope.name,
          resourceName: oldScope.resourceName,
          scope: oldScope.scope,
          dataSourceKey: 'main',
        },
        filterKeys: ['key', 'dataSourceKey'],
        hooks: false,
        transaction,
      });

      scopeMap[key] = newScope.id;
    }

    const roles = await this.db.getRepository('roles').find({
      transaction,
    });

    for (const role of roles) {
      await this.app.db.getRepository('dataSourcesRoles').updateOrCreate({
        values: {
          roleName: role.get('name'),
          dataSourceKey: 'main',
          strategy: role.get('strategy'),
        },
        filterKeys: ['roleName', 'dataSourceKey'],
        hooks: false,
        transaction,
      });
    }

    const oldResources = await this.db.getRepository('rolesResources').find({
      appends: ['actions'],
      transaction,
    });

    for (const oldResource of oldResources) {
      const role = await this.db.getRepository('roles').findOne({
        filter: {
          name: oldResource.roleName,
        },
        transaction,
      });

      if (!role) {
        continue;
      }

      const newResource = await this.db.getRepository('resources').firstOrCreate({
        values: {
          name: oldResource.name,
          roleName: oldResource.roleName,
          usingActionsConfig: oldResource.usingActionsConfig,
          dataSourceKey: 'main',
        },
        transaction,
        filterKeys: ['name'],
        hooks: false,
      });

      for (const oldAction of oldResource.actions) {
        const newActionValues: any = {
          resource: newResource.id,
          name: oldAction.name,
          fields: oldAction.fields,
        };

        if (oldAction.scope) {
          newActionValues.scope = scopeMap[oldAction.scope];
        }

        await this.db.getRepository('roleResourcesActions').create({
          values: newActionValues,
          hooks: false,
          transaction,
        });
      }
    }
  }
}
