import { Migration } from '@nocobase/server';
import { uid } from '@nocobase/utils';

export default class extends Migration {
  on = 'afterSync'; // 'beforeLoad' or 'afterLoad'
  appVersion = '<0.19.0-alpha.10';

  async up() {
    const transaction = await this.db.sequelize.transaction();

    try {
      await this.doUp(transaction);
      await transaction.commit();
    } catch (e) {
      throw e;
    }
  }
  async doUp(transaction) {
    const scopeMap = {};

    const oldScopes = await this.db.getRepository('rolesResourcesScopes').find({
      transaction,
    });

    for (const oldScope of oldScopes) {
      const key = oldScope.key;
      const newScope = await this.db.getRepository('dataSourcesRolesResourcesScopes').firstOrCreate({
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
          id: uid(),
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

      const newResource = await this.db.getRepository('dataSourcesRolesResources').firstOrCreate({
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

        await this.db.getRepository('dataSourcesRolesResourcesActions').create({
          values: newActionValues,
          hooks: false,
          transaction,
        });
      }
    }
  }
}
