import { Plugin } from '@nocobase/server';
import { ACL } from '@nocobase/acl';
import path from 'path';
import { availableActionResource } from './actions/available-actions';
import { roleCollectionsResource } from './actions/role-collections';
import { createACL } from './acl';

async function actionModelToParams(actionModel, resourceName) {
  const fields = actionModel.get('fields');
  const actionPath = `${resourceName}:${actionModel.get('name')}`;

  const actionParams = {
    fields,
  };

  const scope = await actionModel.getScope();

  if (scope) {
    actionParams['filter'] = scope.get('scope');
  }

  return {
    actionPath,
    actionParams,
  };
}

export default class PluginACL extends Plugin {
  acl: ACL;

  getACL() {
    return this.acl;
  }

  async load() {
    const acl = createACL();
    this.acl = acl;

    await this.app.db.import({
      directory: path.resolve(__dirname, 'collections'),
    });

    this.app.resourcer.define(availableActionResource);
    this.app.resourcer.define(roleCollectionsResource);

    this.app.resourcer.use(this.acl.middleware());

    this.app.db.on('roles.afterSave', (model) => {
      const roleName = model.get('name');
      let role = acl.getRole(roleName);

      if (!role) {
        role = acl.define({
          role: model.get('name'),
        });
      }

      role.setStrategy(model.get('strategy'));
    });

    this.app.db.on('roles.afterDestroy', (model) => {
      const roleName = model.get('name');
      acl.removeRole(roleName);
    });

    this.app.db.on('rolesResources.afterSave', async (model, options) => {
      const roleName = model.get('roleName');
      const role = acl.getRole(roleName);

      if (model.usingActionsConfig === true && model._previousDataValues.usingActionsConfig === false) {
        const actions = await model.getActions();
        for (const action of actions) {
          const { actionPath, actionParams } = await actionModelToParams(action, model.get('name'));
          role.grantAction(actionPath, actionParams);
        }
      }

      if (model._previousDataValues.usingActionsConfig === true && model.usingActionsConfig === false) {
        role.revokeResource(model.get('name'));
      }
    });

    this.app.db.on('rolesResourcesActions.beforeBulkUpdate', async (options) => {
      options.individualHooks = true;
    });

    this.app.db.on('rolesResourcesActions.afterSave', async (model) => {
      const resource = await model.getResource();
      if (!resource) {
        const previousResource = await this.app.db.getRepository('rolesResources').findOne({
          filter: {
            id: model._previousDataValues.rolesResourceId,
          },
        });

        const roleName = previousResource.get('roleName') as string;
        const role = acl.getRole(roleName);
        role.revokeAction(`${previousResource.get('name')}:${model.get('name')}`);
        return;
      }

      const roleName = resource.get('roleName');
      const role = acl.getRole(roleName);

      const { actionPath, actionParams } = await actionModelToParams(model, resource.get('name'));
      role.grantAction(actionPath, actionParams);
    });
  }
}
